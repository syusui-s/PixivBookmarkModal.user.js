// ==UserScript==
// @name              PixivBookmarkModal.user.js
// @description       Pixivのブックマークモーダルをタグ一覧ページで表示する
// @include           http://www.pixiv.net/bookmark.php*
// @run-at            document-end
// @version           0.0.1
// ==/UserScript==

'use strict';

const modalContainerId = 'bookark-modal-container';

const overlay = document.createElement('div');
overlay.style.position  = 'fixed';
overlay.style.top       = '0';
overlay.style.left      = '0';
overlay.style.height    = '200%';
overlay.style.width     = '100%';
overlay.style.zIndex    = '99999';
overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
overlay.style.backgroundAttachment = 'fixed';
overlay.style.backgroundRepeat = 'no-repeat';
overlay.style.backgroundPosition = 'center center';
overlay.style.paddingTop = '10px';
overlay.style.textAlign = 'center';
overlay.style.fontSize = '20px';
overlay.style.fontWeight = '900';
overlay.style.color = 'white';

function async(gene, previous_result) {
	const result = gene.next(previous_result);

	if (result.done) return;

	const value = result.value;

	if (value instanceof Promise) {
		value.then((promise_result) => {
			async(gene, promise_result);
		}, (err) => {
			console.log(err);
		});

		value.catch((err) => {
			console.log(err);
		});
	} else {
		async(gene, value);
	}
}

function polling(func, polling_time, times, timeout) {
	if (! ( func instanceof Function &&
			typeof polling_time === "number" &&
			typeof times === "number" &&
			typeof timeout === "number"
		) ) {
		return Promise.reject('polling called with invalid argument(s)');
	}

	return new Promise((resolve, reject) => {
		let count = 0;
		let done  = false;

		let id = window.setInterval(() => {
			if ( func() ) {
				done = true;
				window.clearInterval(id);
				resolve();
			} else if (count < times) {
				count++;
			} else {
				window.clearInterval(id);
				reject('polling reach a maximum retry count');
			}
		}, polling_time);

		window.setTimeout(() => {
			if (!done) {
				window.clearInterval(id);
				reject('polling timeout');
			}
		}, timeout);
	});
}

function sleep(timeout) {
	if (! typeof timeout === "number"){
		return Promise.reject('sleep called with an invalid argument');
	}

	return new Promise((resolve, reject) => {
		window.setTimeout(() => resolve(), timeout);
	});
}

function formToObj(node) {
	if (! (node instanceof HTMLFormElement)) {
		return null;
	}

	const result = {};

	const inputs = node.querySelectorAll('input');
	Array.prototype.forEach.call(inputs, (input) => {
		const type = input.type;

		if (/^(button|submit|reset|image)$/i.test(type)) {
			return;
		} else if (/^radio$/i.test(type) && !input.checked) {
			return;
		}

		result[input.name] = input.value;
	});

	const selects = node.querySelectorAll('select');
	Array.prototype.forEach.call(selects, (select) => {
		const options = select.querySelectorAll('option');

		Array.prototype.filter.call(
			options,
			(e) => e.selected
		).forEach((opt) => {
			result[select.name] = opt.value;
		});
	});

	return result;
}

function serializeForm(obj) {
	let result = Array.prototype.map.call(
		Object.keys(obj),
		(key) => {
			const k = encodeURIComponent(key);
			const v = encodeURIComponent(obj[key]);
			return `${k}=${v}`;
		}
	).join('&');
	
	return result;
}

function promiseXHR(method, url, form) {
	const promise = new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();

		xhr.addEventListener('load', (e) => {
			const xhr = e.target;
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve(xhr.response);
			} else {
				reject(xhr.statusText);
			}
		});

		xhr.addEventListener('error', e => {
			const xhr = e.target;
			reject(xhr.statusText);
		});

		xhr.open(method, url, true);

		
		if (form) {
			xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
			xhr.send( serializeForm(form) );
		} else {
			xhr.send();
		}
	});
	return promise;

}

function getDocument(url) {
	return promiseXHR('GET', url);
}

function postForm(url, form) {
	return promiseXHR('POST', url, form);
}

function getBookmarkEditPage(id) {
	if (! /^\d+$/.test(id)) { return null; }
	
	const url = `http://www.pixiv.net/bookmark_add.php?type=illust&illust_id=${id}`;
	return getDocument(url);
}

function getIllustPage(id) {
	if (! /^\d+$/.test(id)) { return null; }

	const url = `http://www.pixiv.net/member_illust.php?mode=medium&illust_id=${id}`;
	return getDocument(url);
}

function preventScroll(ev) {
	window.scrollTo(window.pageXOffset, window.pageYOffset);
}

function onBookmarkSubmit(ev) {
	const form = ev.target;

	async( (function *() {
		window.addEventListener('scroll', preventScroll);
		overlay.textContent = 'ブックマークしています...';
		document.body.appendChild(overlay);

		const formObj = formToObj(form);
		yield postForm(form.action, formObj);

		overlay.textContent = '完了しました!';
		yield sleep(200);
		document.body.removeChild(overlay);
		window.removeEventListener('scroll', preventScroll);

		// change bgcolor if its tag doesn't have a bookmark page tag;
		const qstr_match = location.href.match(/[?&]tag=([^&#]*)/);
		const input_tag = document.querySelector('#input_tag');

		if (qstr_match &&
			input_tag.value.replace(/\s+/g, '').length !== 0 &&
			! input_tag.value.includes(decodeURI(qstr_match[1]))
		) {
			const id = formObj['id'];
			const works = document.querySelector('ul._image-items');
			const links = works.querySelectorAll('li.image-item > a.work');
			const found = Array.prototype.find.call(links, (link) => {
				return link.href.includes(id);
			});

			if (found) {
				found.parentNode.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
			}
		}

		document.querySelector("#bookark-modal-container > div > div").click();
	})() );

	ev.preventDefault();
}

function removeBookmarkModalContainer() {
	const currentModalElem =
		document.querySelector(`div#${modalContainerId}`);
	if (currentModalElem) { currentModalElem.remove(); }
}

function* setBookmarkTags(id) {
	const input_tag = document.querySelector('#input_tag');

	const content = yield getBookmarkEditPage(id);
	const doc = document.createElement('html');
	doc.innerHTML = content;

	const bookmark_tag = doc.querySelector('#input_tag');
	const tags = bookmark_tag.value;
	if (tags.length > 0) {
		input_tag.value = tags;
	}

	const qstr_match = location.href.match(/[?&]rest=hide/);
	if (qstr_match) {
		const qstr = 'div.bookmark-add-modal input[type="radio"][value="1"]';
		const hide_button = document.querySelector(qstr);
		hide_button.click();
	}
}

function *showBookmarkModal(id) {
	// fetch illust page to show modal
	const content = yield getIllustPage(id);
	const doc = document.createElement('html');
	doc.innerHTML = content;

	const modalElem = doc.querySelector('#wrapper > div.bookmark-add-modal');
	const tagsContainer = doc.querySelector('span.tags-container');

	// append modal elements
	const modalContainer = document.createElement('div');
	modalContainer.id = modalContainerId;
	modalContainer.appendChild(modalElem);
	modalContainer.appendChild(tagsContainer);
	modalElem.querySelector('form').addEventListener('submit', onBookmarkSubmit);

	removeBookmarkModalContainer();
	document.body.appendChild(modalContainer);

	// show bookmark modal
	location.assign('javascript: pixiv.bookmarkModal.initialize();');

	// wait for generation of #input_tag
	yield polling(() => document.querySelector('#input_tag'), 50, 200, 50*200); // 50ms * 200times

	yield* setBookmarkTags(id);

	// PixivAutoTag.user.js
	window.dispatchEvent(new CustomEvent('PixivAutoTag.generateButtons'));
	window.dispatchEvent(new CustomEvent('PixivAutoTag.autoTag'));
}

function rewriteEditLinks() {
	const query = 'a.edit-work';
	const editLinks = document.querySelectorAll(query);

	Array.prototype.forEach.call(editLinks, (link) => {
		if (link.href.match(/^javascript/)) { return; }
		const id = link.href.match(/_id=(\d+)/)[1];

		link.addEventListener('click', (ev) => {
			async(showBookmarkModal(id));
			ev.preventDefault();
		});
		link.href = 'javascript:void(0);';
	});
}

(function () {
	document.addEventListener('AutoPagerize_DOMNodeInserted', rewriteEditLinks, false);
	document.addEventListener('AutoPatchWork.DOMNodeInserted', rewriteEditLinks, false);
	document.addEventListener('AutoPagerAfterInsert', rewriteEditLinks, false);

	rewriteEditLinks();
})();
