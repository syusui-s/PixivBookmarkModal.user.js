// ==UserScript==
// @name         PixivBookmarkModal.user.js
// @author       Shusui Moyatani (@syusui-s)
// @description  Pixivのブックマークモーダルをタグ一覧ページ/作品ページで表示する
// @namespace    https://github.com/syusui-s/PixivBookmarkModal.user.js
// @homepage     https://syusui-s.github.io/PixivBookmarkModal.user.js
// @version      1.1.0
// @match        https://www.pixiv.net/
// @match        https://www.pixiv.net/manga/
// @match        https://www.pixiv.net/novel/
// @match        https://www.pixiv.net/artworks/*
// @match        https://www.pixiv.net/novel/show.php*
// @match        https://www.pixiv.net/users/*/bookmarks/artworks*
// @match        https://www.pixiv.net/users/*/bookmarks/novels*
// @match        https://www.pixiv.net/ranking.php*
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

  const xPathSelectorAllUnordered = (xpath, doc) => {
    const xPathResult = document.evaluate(xpath, doc, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE);
    const results = [];
    for (;;) {
      const node = xPathResult.iterateNext();
      if (node == undefined) break;
      results.push(node);
    }
    return results;
  };

  const bookmarkUrl = (urlString) => {
    const url = new URL(urlString);
    if (url.pathname.startsWith('/artworks/')) {
      const id = url.pathname.match(/^\/artworks\/(\d+)$/)?.[1];
      if (!id) throw new Error('Failed to obtain artwork id from URL');
      return `https://www.pixiv.net/bookmark_add.php?type=illust&illust_id=${id}`;
    } else if (url.pathname === '/novel/show.php') {
      const id = url.searchParams.get('id');
      if (!id) throw new Error('Failed to obtain novel id from URL');
      return `https://www.pixiv.net/novel/bookmark_add.php?id=${id}`;
    } else {
      throw new Error(`bookmarkUrl() is not non-exhaustive: ${urlString}`);
    }
  };

  const openModal = (url, onAdded = () => {}) => {
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

        let submitted = false;
        const form = w.document.querySelector('.bookmark-detail-unit > form');
        form.addEventListener('submit', () => { submitted = true; });
        w.addEventListener('unload', () => {
          close();
          if (submitted) onAdded();
        });
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
        const url = bookmarkUrl(location.href);
        openModal(url);
      }
    });
  }

  window.addEventListener('DOMContentLoaded', (ev) => {
    const attached = 'pixiv_bookmark_modal_attached';
    const changeSVGColor = (svg) => () => svg.style.color = 'rgb(255, 64, 96)';
    setInterval(() => {
      [
        //// for a work page
        // * <button> is for not bookmarked
        // * <a> is for bookmarked
        // <https://www.pixiv.net/artworks/87816551>
        ...[...document.querySelectorAll(`button.gtm-main-bookmark:not(.${attached}), a[href^="/bookmark_add.php"]:not(.${attached})`)].map((link) => {
          const workUrl = location.href; // NOTE use carefully
          const svg = link.querySelector('svg');
          return { link, workUrl, button: link, onAdded: changeSVGColor(svg) };
        }),
        // for pixiv.net top page <https://www.pixiv.net/>
        // and bookmark list
        // and it works in carousel
        ...xPathSelectorAllUnordered(`//a[starts-with(@href, "/artworks/") and not(contains(@class, "${attached}"))]`, document.body).flatMap((link) => {
          const [button] = xPathSelectorAllUnordered('(following-sibling::*//button)[1]', link);
          if (!button) return [];
          const svg = button.querySelector('svg');
          return { link, workUrl: link.href, button, onAdded: changeSVGColor(svg) };
        }),
        ...xPathSelectorAllUnordered(`//a[starts-with(@href, "/novel/show.php?id=") and not(contains(@class, "${attached}"))]`, document.body).flatMap((link) => {
          const [button] = xPathSelectorAllUnordered('(following::*//button)[1]', link);
          if (!button) return [];
          const svg = button.querySelector('svg');
          return { link, workUrl: link.href, button, onAdded: changeSVGColor(svg) };
        }),
        ...[...document.querySelectorAll(`.ranking-image-item > a.work:not(.${attached})`)].flatMap((link) => {
          const button = link.querySelector('._one-click-bookmark');
          if (!button) { console.error("failed to find bookmark button in ranking page"); return []; }
          const onAdded = () => button.classList.add('on');
          return { link, workUrl: link.href, button, onAdded };
        }),
      ].forEach(({ link, workUrl, button, onAdded }) => {
        const url = bookmarkUrl(workUrl);
        if (!button) return;
        button.addEventListener('contextmenu', (ev) => {
          ev.preventDefault();
          openModal(url, onAdded);
        });
        link.classList.add(attached);
      });
    }, 1000);
  });
})();
