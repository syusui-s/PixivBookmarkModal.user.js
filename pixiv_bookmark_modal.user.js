// ==UserScript==
// @name              PixivBookmarkModal.user.js
// @description       Pixivのブックマークモーダルをタグ一覧ページで表示する
// @include           http://www.pixiv.net/bookmark.php?*
// @run-at            document-end
// @version           0.0.1
// ==/UserScript==

var modalContainerId = 'bookark-modal-container';

function getIllustPage(id) {
	if (! /^\d+$/.test(id)) { return null; }

	const promise = new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		const url = `http://www.pixiv.net/member_illust.php?mode=medium&illust_id=${id}`;

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

function removeBookmarkModalContainer() {
	const currentModalElem =
		document.querySelector(`div#${modalContainerId}`);
	if (currentModalElem) { currentModalElem.remove(); }
}

function showBookmarkModal(id) {
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

			pixiv.bookmarkModal.initialize();
		},
		error => {
			window.alert('failed to fetch illust page');
		}
	);
}

(function () {
	const editLinkNodes =
		document.querySelectorAll('#f > div.display_editable_works > ul > li > a.edit-work');
	const editLinks = Array.prototype.slice.call(editLinkNodes);

	editLinks.forEach((link) => {
		const id = link.href.match(/_id=(\d+)/)[1];

		link.addEventListener('click', ev => {
			showBookmarkModal(id);
			ev.preventDefault();
		});
		link.href = 'javascript:void(0);';
	});
})();
