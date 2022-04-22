PixivBookmarkModal.user.js : モーダルウィンドウで pixiv のブックマークを編集
=====

モーダルウィンドウ上で、pixiv の ブックマークを編集できる UserScript です。

This UserScript allows you to edit a [pixiv](https://pixiv.net/) bookmark in a modal window.

次の場合に、モーダルウィンドウで pixiv のブックマーク編集画面を開きます:

* [作品ページ](https://www.pixiv.net/artworks/20)
	* ブックマークボタンを右クリック
	* 作品ページで、`Shift+B`を入力
* [ブックマークの一覧](https://www.pixiv.net/bookmark.php)
	* 編集ボタンを右クリック
* [トップページ](https://www.pixiv.net/)
	* ブックマークボタンを右クリック
* [ランキングページ](https://www.pixiv.net/ranking.php)
	* ブックマークボタンを右クリック
* [フォロー新着作品](https://www.pixiv.net/bookmark_new_illust.php)
	* ブックマークボタンを右クリック

導入方法
----

1. UserScript 拡張機能を入手してください
	 <img src="https://user-images.githubusercontent.com/1228033/163796941-9da266b3-c2a6-4827-949e-d617a8adb934.png" width="480" />
	* [Greasemonkey](https://www.greasespot.net/) (FLOSS, Firefox only)
	* [Violentmonkey](https://violentmonkey.github.io/) (FLOSS, multi-platform)
	* [Tampermonkey](https://www.tampermonkey.net/) (Proprietary, multi-platform)
	* もしくは、Chrome/Chromium ネイティブサポートを利用
		* [pixiv_bookmark_modal.user.js](https://syusui-s.github.io/PixivBookmarkModal.user.js/pixiv_bookmark_modal.user.js) をダウンロード
		* `chrome://extensions/` を開く
		* 画面にファイルをドラッグ & ドロップ

1. 次のリンクを開いてください
	* <https://syusui-s.github.io/PixivBookmarkModal.user.js/pixiv_bookmark_modal.user.js>

1. 「インストール」ボタンをクリックしてください

PixivAutoTag.user.js との連携
----
<https://github.com/syusui-s/PixivAutoTag.user.js> を導入すると、
モーダルウィンドウ上でブックマークタグの自動タグ付けを実行します。

もしもバグを見つけたら
----
[GitHub Issueに登録](https://github.com/syusui-s/PixivBookmarkModal.user.js/issues/new/choose)してください

ライセンス
----
AGPL-3.0以降でライセンスします。
