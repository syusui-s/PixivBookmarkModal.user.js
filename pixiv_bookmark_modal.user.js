// ==UserScript==
// @name              PixivBookmarkModal.user.js
// @description       Pixivのブックマークモーダルをタグ一覧ページで表示する
// @include           http://www.pixiv.net/bookmark.php*
// @run-at            document-end
// @version           0.0.1
// ==/UserScript==

'use strict';

var modalContainerId = 'bookark-modal-container';

function async(gene) {
	const result = gene.next();

	if (result.done) return;

	if (result.value instanceof Promise) {
		result.value.then(() => {
			async(gene);
		}, err => console.log(err) );
	} else {
		async(gene);
	}
}

function polling(func, times, timeout) {
	if (!(	func instanceof Function &&
			typeof times == "number" &&
			typeof timeout == "number"
		) ) {
		return Promise.reject();
	}

	return new Promise((resolve, reject) => {
		let count = 0;

		let id = window.setInterval(() => {
			if ( func() ) { resolve(); }
			else if (count < times) { count++; }
			else { window.clearInterval(id); reject(); }
		}, timeout);
	});
}

function getDocument(url) {
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

		xhr.open('GET', url);
		xhr.send();
	});
	return promise;
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

function setBookmarkTags(id) {
	const input_tag = document.querySelector('#input_tag');

	return new Promise((resolve, reject) => {
		getBookmarkEditPage(id).then(
			content => {
				const doc = document.createElement('html');
				doc.innerHTML = content;

				const bookmark_tag = doc.querySelector('#input_tag');
				const tags = bookmark_tag.value;
				if (tags.length > 0) {
					input_tag.value = tags;
				}
				resolve();
			},
			error => {
				window.alert('failed to fetch bookmark page');
				reject();
			}
		);
	});
}

function removeBookmarkModalContainer() {
	const currentModalElem =
		document.querySelector(`div#${modalContainerId}`);
	if (currentModalElem) { currentModalElem.remove(); }
}

function *showBookmarkModal(id) {
	yield new Promise((resolve, reject) => {
		getIllustPage(id).then(
			content => {
				const doc = document.createElement('html');
				doc.innerHTML = content;

				const modalElem = doc.querySelector('#wrapper > div.bookmark-add-modal');
				const tagsContainer = doc.querySelector('span.tags-container');

				const modalContainer = document.createElement('div');
				modalContainer.id = modalContainerId;
				modalContainer.appendChild(modalElem);
				modalContainer.appendChild(tagsContainer);

				removeBookmarkModalContainer();
				document.body.appendChild(modalContainer);

				// show bookmark modal
				location.assign('javascript: pixiv.bookmarkModal.initialize();');

				resolve();
			},
			error => {
				reject('failed to fetch illust page');
			}
		);
	});

	yield polling(() => document.querySelector('#input_tag'), 200, 50);
	
	yield setBookmarkTags(id);

	window.postMessage('pixiv_auto_tag:generateButtons', location.origin);
	window.postMessage('pixiv_auto_tag:autoTag', location.origin);
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
