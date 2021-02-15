// ==UserScript==
// @name         PixivBookmarkModal.user.js
// @author       Shusui Moyatani (@syusui-s)
// @description  Pixivのブックマークモーダルをタグ一覧ページ/作品ページで表示する
// @namespace    https://github.com/syusui-s/PixivBookmarkModal.user.js
// @homepage     https://syusui-s.github.io/PixivBookmarkModal.user.js
// @version      1.0.0
// @match        https://www.pixiv.net/artworks/*
// @match        https://www.pixiv.net/novel/show.php*
// @match        https://www.pixiv.net/users/*/bookmarks/artworks*
// @match        https://www.pixiv.net/users/*/bookmarks/novels*
// @grant        none
// @updateURL    https://syusui-s.github.io/PixivBookmarkModal.user.js/pixiv_bookmark_modal.user.js
// @downloadURL  https://syusui-s.github.io/PixivBookmarkModal.user.js/pixiv_bookmark_modal.user.js
// @supportURL   https://syusui-s.github.io/PixivBookmarkModal.user.js
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';
  const useRef = (initial = undefined) => ({ current: undefined });
  const el = (name, ...args) => {
    const props = typeof args[0] === 'object' ? args[0] : {};
    const c = typeof args[0] !== 'object' ? args[0] : args[1];
    const children = c instanceof Array ? c : c != null ? [c] : [];
    const e = name ? document.createElement(name) : document.createDocumentFragment();
    [...Object.entries(props || {})].forEach(([p, v]) => {
      if (p === 'class' || p === 'className') e.className = v;
      else if (p.startsWith('on')) e.addEventListener(p.slice(2), v);
      else if (p === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else if (p === 'ref') v.current = e;
      else e[p] = v;
    });
    const add = (c) => {
      let r;
      if (c instanceof HTMLElement || c instanceof DocumentFragment) r = c;
      else if (c instanceof Array) return c.forEach(add);
      else if (c != null) r = document.createTextNode(c);
      else return;
      e.appendChild(r);
    };
    children.forEach(add);
    return e;
  };

  const bookmarkUrl = () => {
    const url = new URL(location.href);
    if (url.pathname.startsWith('/artworks/')) {
      const id = new URL(location.href).pathname.match(/^\/artworks\/(\d+)$/)?.[1];
      if (!id) throw new Error('Failed to obtain artwork id from URL');
      return `https://www.pixiv.net/bookmark_add.php?type=illust&illust_id=${id}`;
    } else if (url.pathname === '/novel/show.php') {
      const id = url.searchParams.get('id');
      if (!id) throw new Error('Failed to obtain novel id from URL');
      return `https://www.pixiv.net/bookmark_add.php?id=${id}`;
    } else {
      throw new Error('bookmarkUrl() is not non-exhaustive');
    }
  };

  const openModal = (url) => {
    const iframeRef = useRef();

    const close = () => root.remove();

    const root = el(
      'div', {
        style: { zIndex: 999, position: 'fixed', top: 0, left: 0, height: '100vh', width: '100vw', background: 'rgba(0,0,0,0.5)', },
        onclick: close,
      }, [
        el('iframe', { src: url, style: { height: '95vh', width: '80vw', margin: '0 10vw', border: 'none' }, ref: iframeRef })
      ],
    );
    document.body.appendChild(root);

    if (iframeRef.current) {
      iframeRef.current.focus();
      const w = iframeRef.current.contentWindow;
      w.addEventListener('DOMContentLoaded', (ev) => {
        w.document.body.style.paddingTop = '70px';
        w.document.querySelector('#js-mount-point-header').style.display = 'none';
        w.document.querySelector('#header-banner').style.top = '10px';
        w.addEventListener('unload', () => close());
      });
    }

    window.addEventListener('keydown', ev => {
      if (ev.key == 'Escape') {
        ev.stopPropagation();
        ev.preventDefault();
        close();
      }
    });
  };

  if (location.href.startsWith('https://www.pixiv.net/artworks/') ||
      location.href.startsWith('https://www.pixiv.net/novel/show.php')
     )
  {
    window.addEventListener('keydown', ev => {
      if (ev.key === 'B' && ev.shiftKey) {
        ev.stopPropagation();
        ev.preventDefault();
        const url = bookmarkUrl();
        openModal(url);
      }
    });
  }
  setInterval(() => {
    [...document.querySelectorAll('a[href^="/bookmark_add.php"]')].forEach((link) => {
      const url = link.href;
      link.addEventListener('click', (ev) => {
        ev.preventDefault();
        openModal(url)
      });
      link.href = 'javascript:void(0);';
    });
  }, 1000);
})();
