// 「はじめる」ボタン
const btn = document.querySelector("#btn_play");
// 「つぎへ」ボタン
const btn_next = document.querySelector("#to_next");
// 「もう1回きく」ボタン
const btn_repeat = document.querySelector("#btn_repeat");
// 一つ前に戻るボタン
const btn_back = document.querySelector("#back");
// 「はじめる」&「とめる」ボタン
const play_pause = document.querySelector("#play_pause");
// 答えを読むボタン
const btn_a  = document.querySelector("#read_answer");
// 再生する音声ファイルのパス
let path;
// 再生する音声ファイルのパス（問題）
let pathQ;
// 再生する音声ファイルのパス（答え）
let pathA;
// 音声ファイル名の数字1
let x;
// 音声ファイル名の数字2
let y;
// 音声ファイル名の数字1（順番に再生）
let ascX = 1;
// 音声ファイル名の数字2（順番に再生）
let ascY = 0;
// 音声ファイル名（問題・答えセット）
let filename;
// 音声ファイル名（問題）
let filenameQ;
// 音声ファイル名（答え）
let filenameA;
// 再生リスト
let playList = [];
// 再生リスト（問題）
let playListQ = [];
// 再生リスト（答え）
let playListA = [];
// 答えが再生済みか判定用
let answerPlayed = false;

/**
 * スマホではhoverを無効にする
 */
var touch = 'ontouchstart' in document.documentElement
            || navigator.maxTouchPoints > 0
            || navigator.msMaxTouchPoints > 0;

if (touch) { // remove all :hover stylesheets
    try { // prevent exception on browsers not supporting DOM styleSheets properly
        for (var si in document.styleSheets) {
            var styleSheet = document.styleSheets[si];
            if (!styleSheet.rules) continue;

            for (var ri = styleSheet.rules.length - 1; ri >= 0; ri--) {
                if (!styleSheet.rules[ri].selectorText) continue;

                if (styleSheet.rules[ri].selectorText.match(':hover')) {
                    styleSheet.deleteRule(ri);
                }
            }
        }
    } catch (ex) {}
}

/**
 * 見出し・カウンターを選択した段に変更
 */
window.addEventListener("DOMContentLoaded", (function () {
    const ttl = document.getElementById('player_ttl');
    const parent = document.getElementById('count_parent');
    if(getParam('step') == '1') {
        ttl.innerHTML = '<img src="./img/txt-play_13.png" alt="１〜３のだんをよむ">';
        parent.innerHTML = '27';
    } else if(getParam('step') == '4') {
        ttl.innerHTML = '<img src="./img/txt-play_46.png" alt="４〜６のだんをよむ">';
        parent.innerHTML = '27';
    } else if(getParam('step') == '7') {
        ttl.innerHTML = '<img src="./img/txt-play_79.png" alt="７〜９のだんをよむ">';
        parent.innerHTML = '27';
    }
}));

/**
 * 選択されたボタンににselectクラスを付与
 */
// 次を読むまでの時間
$(function() {
    $('#next_time li').click(function(){
        $('#next_time li').removeClass('select');
        $(this).addClass('select');
    });
});
// 同じ九九を読む回数
$(function() {
    $('#repeat li').click(function(){
        $('#repeat li').removeClass('select');
        $(this).addClass('select');
    });
});
// 答えを読むまでの時間
$(function() {
    $('#answer_time li').click(function(){
        $('#answer_time li').removeClass('select');
        $(this).addClass('select');
    });
});

/**
 * 再生終了時のポップアップ
 */
function showEndPopup() {
    var popup = document.getElementById('js-popup');
    if(!popup) return;
    popup.classList.add('is-show');
}

/**
 * はじめにもどる押下時のポップアップ
 */
function showbackPopup() {
    var popup02 = document.getElementById('js-popup02');
    if(!popup02) return;

    var blackBg = document.getElementById('js-black-bg');
    var closeBtn = document.getElementById('js-close-btn');
    var showBtn = document.getElementById('back_top');

    closePopUp(blackBg);
    closePopUp(closeBtn);
    closePopUp(showBtn);
    function closePopUp(elem) {
        if(!elem) return;
        elem.addEventListener('click', function() {
            popup02.classList.toggle('is-show');
        });
    }
} showbackPopup();

/**
 * パラメータ値取得
 *
 * @param  name {string} パラメータのキー文字列
 * @return  url {url} 対象のURL文字列（任意）
 */
function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/**
 * 九九をランダムに再生するか、順番に再生するか
 * 
 * 初期値：ランダム
 */
function isRandom() {
    let random_flg = true;
    if(getParam('read') == 'all') {
        random_flg = false;
    }
    return random_flg;
}

/**
 * 答えを読むまでの時間を取得
 * 
 * @return  interval_time インターバルの時間 {0=つづけて(デフォルト), 3=3秒, 6=秒, m=手動}
 */
function readAnswerInterval() {
    // 初期値
    let interval_time = 0;
    let answer_time = $('#answer_time .select').data('answer');

    // クリックしたボタンのdata属性を取得
    $('#answer_time li').click(function(){
        $('#answer_time li').removeClass('select');
        $(this).addClass('select');
        answer_time = $('#answer_time .select').data('answer');
    });

    // 取得したdata属性からインターバルの時間を返却
    if(answer_time == 'continue') {
        interval_time = 0;
    } else if(answer_time == '3000') {
        interval_time = 3000;
    } else if(answer_time == '6000') {
        interval_time = 6000;
    } else if(answer_time == 'answer-manual') {
        interval_time = 'm';
    }
    return interval_time;
}

/**
 * x*yのxの値をランダムに生成
 */
function getX() {
    let num;
    // 選択している九九の段を判定
    if(getParam('step') == 'all') {
        // 全部の段
        num = Math.floor( Math.random() * 9 ) + 1;
    } else if(getParam('step') == '1') {
        // １〜３の段
        num = Math.floor( Math.random() * 3 ) + 1;
    } else if(getParam('step') == '4') {
        // ４〜６の段
        num = Math.floor( Math.random() * 3 ) + 4;
    } else if(getParam('step') == '7') {
        // ７〜９の段
        num = Math.floor( Math.random() * 3 ) + 7;
    }
    return num;
}

/**
 * ランダム再生：問題と答えがセットのファイルを取得
 */
function getRandomFileAll() {
    if(getParam('step') == 'all') {
        // 全ての段81パターンのパスを生成
        while(playList.length < 81) {
            // 音声ファイルのパスを生成
            x = getX();
            y = Math.floor( Math.random() * 9 ) + 1;
            filename = 'k'+ x + y +'.mp3';
            path = 'audio/all/' + filename;

            // パスが重複すればリストに存在しないパスになるまでループ
            while(playList.includes(path)) {
                if(playList.length >= 81) {
                    break;
                }
                // 音声ファイルのパスを再度生成
                x = getX();
                y = Math.floor( Math.random() * 9 ) + 1;
                filename = 'k'+ x + y +'.mp3';
                path = 'audio/all/' + filename;
            }

            // 再生リストに追加
            playList.push(path);

        }

    } else if(getParam('step') != 'all') {
        // 選択した段27パターンのパスを生成
        while(playList.length < 27) {
            // 音声ファイルのパスを生成
            x = getX();
            y = Math.floor( Math.random() * 9 ) + 1;
            filename = 'k'+ x + y +'.mp3';
            path = 'audio/all/' + filename;

            // パスが重複すればリストに存在しないパスになるまでループ
            while(playList.includes(path)) {
                if(playList.length >= 27) {
                    break;
                }
                // 音声ファイルのパスを再度生成
                x = getX();
                y = Math.floor( Math.random() * 9 ) + 1;
                filename = 'k'+ x + y +'.mp3';
                path = 'audio/all/' + filename;
            }

            // 再生リストに追加
            playList.push(path);
            
        }

    }
    return playList;
}

/**
 * ランダム再生：問題と答えのファイルを別々に取得
 */
function getRandomFileQA() {
    if(getParam('step') == 'all') {
        // 全ての段81パターンのパスを生成
        while(playListQ.length < 81) {
            // 音声ファイルのパスを生成
            x = getX();
            y = Math.floor( Math.random() * 9 ) + 1;

            // 問題の音声ファイル名を生成
            filenameQ = 'q'+ x + y +'.mp3';
            // 答えの音声ファイル名を生成
            filenameA = 'a'+ x + y +'.mp3';

            // 問題のパスを作成
            pathQ = 'audio/q/' + filenameQ;
            // 答えのパスを作成
            pathA = 'audio/a/' + filenameA;

            // パスが重複すればリストに存在しないパスになるまでループ
            while(playListQ.includes(pathQ)) {
                if(playListQ.length >= 81) {
                    break;
                }
                // 音声ファイルのパスを再度生成
                x = getX();
                y = Math.floor( Math.random() * 9 ) + 1;
                filenameQ = 'q'+ x + y +'.mp3';
                filenameA = 'a'+ x + y +'.mp3';
                pathQ = 'audio/q/' + filenameQ;
                pathA = 'audio/a/' + filenameA;
            }

            // 再生リストに追加
            playListQ.push(pathQ);
            playListA.push(pathA);
        }

    } else if(getParam('step') != 'all') {
        // 選択した段27パターンのパスを生成
        while(playListQ.length < 27) {
            // 音声ファイルのパスを生成
            x = getX();
            y = Math.floor( Math.random() * 9 ) + 1;

            // 問題の音声ファイル名を生成
            filenameQ = 'q'+ x + y +'.mp3';
            // 答えの音声ファイル名を生成
            filenameA = 'a'+ x + y +'.mp3';

            // 問題のパスを作成
            pathQ = 'audio/q/' + filenameQ;
            // 答えのパスを作成
            pathA = 'audio/a/' + filenameA;

            // パスが重複すればリストに存在しないパスになるまでループ
            while(playListQ.includes(pathQ)) {
                if(playListQ.length >= 27) {
                    break;
                }
                // 音声ファイルのパスを再度生成
                x = getX();
                y = Math.floor( Math.random() * 9 ) + 1;
                filenameQ = 'q'+ x + y +'.mp3';
                filenameA = 'a'+ x + y +'.mp3';
                pathQ = 'audio/q/' + filenameQ;
                pathA = 'audio/a/' + filenameA;
            }

            // 再生リストに追加
            playListQ.push(pathQ);
            playListA.push(pathA);
        }
    }

    return {
        audioQ: playListQ,
        audioA: playListA
    }
}

/**
 * 順番に再生：問題と答えがセットのファイルを取得
 */
function getAscFileAll() {
    // 選択している九九の段を判定
    if(getParam('step') == 'all') { // 全部の段
        while(playList.length < 81) {
            // x*yのyが9を越えたら次の段へ、yの値をリセット
            if(ascY >= 9) {
                ascX = ascX + 1;
                ascY = 0;
            }
            // x*yのxが9を越えたら処理を終了
            if(ascX > 9) {
                break;
            }

            ascY = ascY + 1;

            filename = 'k'+ ascX + ascY +'.mp3';
            path = 'audio/all/' + filename;

            playList.push(path);
        }

    } else if(getParam('step') == '1') { // １〜３の段
        while(playList.length < 27) {
            // x*yのyが9を越えたら次の段へ、yの値をリセット
            if(ascY >= 9) {
                ascX = ascX + 1;
                ascY = 0;
            }
            // x*yのxが9を越えたら処理を終了
            if(ascX > 3) {
                break;
            }

            ascY = ascY + 1;

            filename = 'k'+ ascX + ascY +'.mp3';
            path = 'audio/all/' + filename;

            playList.push(path);
        }

    } else if(getParam('step') == '4') { // ４〜６の段
        while(playList.length < 27) {
            // 4の段からスタート
            if(ascX <= 4) {
                ascX = 4;
            }
            // x*yのyが9を越えたら次の段へ、yの値をリセット
            if(ascY >= 9) {
                ascX = ascX + 1;
                ascY = 0;
            }
            // x*yのxが9を越えたら処理を終了
            if(ascX > 6) {
                break;
            }

            ascY = ascY + 1;

            filename = 'k'+ ascX + ascY +'.mp3';
            path = 'audio/all/' + filename;

            playList.push(path);
        }

    } else if(getParam('step') == '7') { // ７〜９の段
        while(playList.length < 27) {
            // 4の段からスタート
            if(ascX <= 7) {
                ascX = 7;
            }
            // x*yのyが9を越えたら次の段へ、yの値をリセット
            if(ascY >= 9) {
                ascX = ascX + 1;
                ascY = 0;
            }
            // x*yのxが9を越えたら処理を終了
            if(ascX > 9) {
                break;
            }

            ascY = ascY + 1;

            filename = 'k'+ ascX + ascY +'.mp3';
            path = 'audio/all/' + filename;

            playList.push(path);
        }
    }
    return playList;
}

/**
 * 順番に再生、問題と答えのファイルを別々に取得
 */
function getAscFileQA() {
    // 選択している九九の段を判定
    if(getParam('step') == 'all') { // 全部の段
        while(playList.length < 81) {
            // x*yのyが9を越えたら次の段へ、yの値をリセット
            if(ascY >= 9) {
                ascX = ascX + 1;
                ascY = 0;
            }
            // x*yのxが9を越えたら処理を終了
            if(ascX > 9) {
                break;
            }

            ascY = ascY + 1;

            filenameQ = 'q'+ ascX + ascY +'.mp3';
            pathQ = 'audio/q/' + filenameQ;
            filenameA = 'a'+ ascX + ascY +'.mp3';
            pathA = 'audio/a/' + filenameA;

            // 再生リストに追加
            playListQ.push(pathQ);
            playListA.push(pathA);
        }

    } else if(getParam('step') == '1') { // １〜３の段
        while(playList.length < 27) {
            // x*yのyが9を越えたら次の段へ、yの値をリセット
            if(ascY >= 9) {
                ascX = ascX + 1;
                ascY = 0;
            }
            // x*yのxが9を越えたら処理を終了
            if(ascX > 3) {
                break;
            }

            ascY = ascY + 1;

            filenameQ = 'q'+ ascX + ascY +'.mp3';
            pathQ = 'audio/q/' + filenameQ;
            filenameA = 'a'+ ascX + ascY +'.mp3';
            pathA = 'audio/a/' + filenameA;

            // 再生リストに追加
            playListQ.push(pathQ);
            playListA.push(pathA);
        }

    } else if(getParam('step') == '4') { // ４〜６の段
        while(playList.length < 27) {
            // 4の段からスタート
            if(ascX <= 4) {
                ascX = 4;
            }
            // x*yのyが9を越えたら次の段へ、yの値をリセット
            if(ascY >= 9) {
                ascX = ascX + 1;
                ascY = 0;
            }
            // x*yのxが9を越えたら処理を終了
            if(ascX > 6) {
                break;
            }

            ascY = ascY + 1;

            filenameQ = 'q'+ ascX + ascY +'.mp3';
            pathQ = 'audio/q/' + filenameQ;
            filenameA = 'a'+ ascX + ascY +'.mp3';
            pathA = 'audio/a/' + filenameA;

            // 再生リストに追加
            playListQ.push(pathQ);
            playListA.push(pathA);
        }

    } else if(getParam('step') == '7') { // ７〜９の段
        while(playList.length < 27) {
            // 4の段からスタート
            if(ascX <= 7) {
                ascX = 7;
            }
            // x*yのyが9を越えたら次の段へ、yの値をリセット
            if(ascY >= 9) {
                ascX = ascX + 1;
                ascY = 0;
            }
            // x*yのxが9を越えたら処理を終了
            if(ascX > 9) {
                break;
            }

            ascY = ascY + 1;

            filenameQ = 'q'+ ascX + ascY +'.mp3';
            pathQ = 'audio/q/' + filenameQ;
            filenameA = 'a'+ ascX + ascY +'.mp3';
            pathA = 'audio/a/' + filenameA;

            // 再生リストに追加
            playListQ.push(pathQ);
            playListA.push(pathA);
        }
    }
    return {
        audioQ: playListQ,
        audioA: playListA
    }
}

/**
 * 音声ファイル再生処理
 */
var audio = new Audio();
function audioPlay(path) {
    // ロードリクエストが中断されるのを防ぐため、ロードが完了するまで「次へ」ボタンを非活性にしておく
    if(!btn_next.classList.contains('disabled')) {
        btn_next.classList.add('disabled');
    }

    // 「一時停止ボタン」に切り替え
    play_pause.innerHTML = '<div class="btn_pause"><img src="./img/btn-pause.png" alt="とめる"></div>';
    // 再生・停止ボタンを活性にする
    if(play_pause.classList.contains('disabled')){
        play_pause.classList.remove('disabled');
    }

    // 音声ファイルを再生する    
    audio.src = path;
    audio.load();
    var playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.then(_ => {
            // ロードリクエストが完了したので「次へ」ボタンを活性にする、最後の読み上げの場合は非活性のまま
            if(getParam('step') == 'all' && counter >= 81) {
                if(btn_next.classList.contains('disabled')) {
                    btn_next.classList.add('disabled');
                }
            } else if(getParam('step') != 'all' && counter >= 27) {
                if(btn_next.classList.contains('disabled')) {
                    btn_next.classList.add('disabled');
                }
            } else if(btn_next.classList.contains('disabled')) {
                btn_next.classList.remove('disabled');
            }
        })
        .catch(error => {
            console.log('九九の再生でエラーが発生しました。');
        });
    }
}

/**
 * 次の九九を読み上げる
 */
function playNextAudio() {
    // 次を読むまでの時間を取得
    let next_time = $('#next_time .select').data('next');
    if(next_time == 'manual') {
        // 手動
        return;
    } else if(next_time == 1000 || next_time == 5000 || next_time == 10000) {
        // 5秒、10秒、1秒の場合
        setTimeout(function(){
            init();
        }, next_time);
    }
}

/**
 * 再生数カウンター
 */
function playCounter() {
    counter++;
    if(!playList.length && !playListQ.length) {
        child.innerHTML = '01';
    } else if(counter < 10) {
        child.innerHTML = '0' + counter;
    } else {
        child.innerHTML = counter;
    }
}

/**
 * 初期処理
 */
// 繰り返し再生回数
let repeatCounter = 0;
// 音声リスト保存用
let audioListQA;
// 再生数カウンターの分子
let child = document.getElementById('count_child');
// 現在の再生数
let counter = 0;

function init() {
    // 再生用の画面に切り替え
    $('#config_sec').addClass('dsp_none');
    $('#read_sec').removeClass('dsp_none');

    // 再生数カウンター
    playCounter();

    // 再生カウンターが1以下の場合戻るボタンを非活性にする
    if(counter <= 1) {
        if(!btn_back.classList.contains('disabled')) {
            btn_back.classList.add('disabled');
        }    
    } else {
        // 再生カウンターが2以上場合戻るボタンを活性にする
        if(btn_back.classList.contains('disabled')) {
            btn_back.classList.remove('disabled');
        }
    }

    // 繰り返し再生の設定を初期化
    repeatCounter = 0;

    // ランダム判定
    if(isRandom()) {
        if(readAnswerInterval() == 0) { //  答えを読むまでの時間「つづけて」
            // 音声リストを取得
            while(audioListQA === undefined || audioListQA === null) {
                audioListQA = getRandomFileAll();
            }
            // 音声を再生
            audioPlay(audioListQA[counter - 1]);
            return;

        } else if(readAnswerInterval() == 3000 || readAnswerInterval() == 6000 || readAnswerInterval() == 'm') { // 答えを読むまでの時間「3,6秒,手動」
            // 問題と答えの音声ファイルを別々に取得
            while(audioQ === undefined || audioQ === null || audioA === undefined || audioA === null) {
                var {audioQ, audioA} = getRandomFileQA();
                playListQ = audioQ;
                playListA = audioA;
            }
            // 問題の音声ファイルを再生
            audioPlay(playListQ[counter - 1]);
            return;

        }
    } else if(!isRandom()) {
        if(readAnswerInterval() == 0) { //  答えを読むまでの時間「つづけて」
            //  音声リストを取得
            while(audioListQA === undefined || audioListQA === null) {
                audioListQA = getAscFileAll();
            }
            // 音声を再生
            audioPlay(audioListQA[counter - 1]);
            return;

        } else if(readAnswerInterval() == 3000 || readAnswerInterval() == 6000 || readAnswerInterval() == 'm') { // 答えを読むまでの時間「3,6秒,手動」
            // 問題と答えの音声ファイルを別々に取得
            while(audioQ === undefined || audioQ === null || audioA === undefined || audioA === null) {
                var {audioQ, audioA} = getAscFileQA();
                playListQ = audioQ;
                playListA = audioA;
            }
            // 問題の音声ファイルを再生
            audioPlay(playListQ[counter - 1]);
            return;

        }
    }
}

/**
 * 各ボタンのクリックイベント
 */
// ”はじめる”ボタン
btn.addEventListener("click", ()=>{
    // 答えを読むまでの時間が「手動」ならば答えを聞くボタンを表示
    if(readAnswerInterval() == 'm') {
        $('#read_answer').removeClass('hidden');
    }
    // 九九再生イベント
    init();
});

// ”つぎへ”ボタン
btn_next.addEventListener("click", ()=>{
    // 繰り返しカウンターを初期化
    repeatCounter = 0;

    // 次へボタンを一度非活性に
    if(!btn_next.classList.contains('disabled')) {
        btn_next.classList.add('disabled');
    }

    // 1枚目の再生であれば戻るボタンを非活性にする
    if(counter < 1) {
        if(!btn_back.classList.contains('disabled')) {
            btn_back.classList.add('disabled');
        }
    } else {
        if(btn_back.classList.contains('disabled')) {
            btn_back.classList.remove('disabled');
        }
    }

    // 再生数カウンター
    playCounter();

    if(readAnswerInterval() != 0) {
        // 問題と答えが別々の場合は答え再生済みフラグを折る
        answerPlayed = false;
        audioPlay(playListQ[counter - 1]);
    } else if(readAnswerInterval() == 0) {
        // 問題と答えがセット
        audioPlay(audioListQA[counter - 1]);
    }
});

// もう1回聞くボタン
btn_repeat.addEventListener("click", ()=>{
    // 繰り返しカウンターを初期化
    repeatCounter = 0;

    audio.currentTime = 0;
    if(readAnswerInterval() != 0) {
        // 問題と答えが別々の場合
        answerPlayed = false;
        audioPlay(playListQ[counter - 1]);
    } else if(readAnswerInterval() == 0) {
        // 問題と答えがセット
        audioPlay(audioListQA[counter - 1]);
    }
    return;
});

// 一つ前に戻るボタン
btn_back.addEventListener("click", ()=>{
    if(counter >= 2) {
        // 繰り返しカウンターを初期化
        repeatCounter = 0;
        
        // カウンターを1つ戻す
        counter = counter - 1;
        if(counter < 10) {
            child.innerHTML = '0' + counter;
        } else {
            child.innerHTML = counter;
        }

        // カウンターが1以下であれば戻るボタンを非活性にする
        if(counter <= 1) {
            if(!btn_back.classList.contains('disabled')) {
                btn_back.classList.add('disabled');
            }
        } else {
            if(btn_back.classList.contains('disabled')) {
                btn_back.classList.remove('disabled');
            }
        }

        // 音声を再生
        if(readAnswerInterval() != 0) {
            // 問題と答えが別々の場合
            answerPlayed = false;
            audioPlay(playListQ[counter - 1]);
        } else if(readAnswerInterval() == 0) {
            // 問題と答えがセット
            audioPlay(audioListQA[counter - 1]);
        }
    }
    return;
});

// ”とめる”、”はじめる”ボタン
play_pause.addEventListener("click", ()=>{    
    // pausedがtrue=>停止, false=>再生中
    if( !audio.paused ){
        play_pause.innerHTML = '<div class="img_play"><img src="./img/btn-play02.png" alt="はじめる"></div>';  // 「再生ボタン」に切り替え
        audio.pause();
    } else {
        play_pause.innerHTML = '<div class="btn_pause"><img src="./img/btn-pause.png" alt="とめる"></div>';  // 「一時停止ボタン」に切り替え
        audio.play();
    }
});

// 答えを読むボタン
btn_a.addEventListener("click", ()=>{
    if(playListA) {
        // 答え再生済みフラグを立てる
        answerPlayed = true;
        // 答えを再生
        audioPlay(playListA[counter - 1]);
    }    
    return;
});

/**
 * 繰り返し再生
 */
function repeatPlay(audioList) {
    // 繰り返し回数カウント
    repeatCounter++;

    // 同じ九九を読む回数を取得
    let repeat = $('#repeat .select').data('read');

    // 1回再生
    if(repeat == 1) {
        // 全ての音声が再生されればポップアップ表示
        if(getParam('step') == 'all' && counter >= 81) {
            showEndPopup();
            return;
        } else if(getParam('step') != 'all' && counter >= 27) {
            showEndPopup();
            return;
        }
        // 次の九九を再生
        playNextAudio();

    } else if(repeat == 2 && repeatCounter < 2 || repeat == 3 && repeatCounter < 3) {
        // 2回または3回再生
        audio.currentTime = 0;
        audioPlay(audioList[counter - 1]);
        
    } else {
        // 全ての音声が再生されればポップアップ表示
        if(getParam('step') == 'all' && counter >= 81) {
            showEndPopup();
            return;
        } else if(getParam('step') != 'all' && counter >= 27) {
            showEndPopup();
            return;
        }
        // 次の九九を再生
        playNextAudio();

    }
}

/**
 * 再生終了時のイベント
 */
audio.addEventListener("ended", ()=>{
    // はじめる・とめるボタンを非活性に
    if(!play_pause.classList.contains('disabled')) {
        play_pause.classList.add('disabled');
    }

    // 問題と答えがセットの場合
    if(readAnswerInterval() == 0) {
        repeatPlay(audioListQA);
        return;
    }

    // 問題と答えを別々に読む場合
    if(readAnswerInterval() == 3000 && !answerPlayed || readAnswerInterval() == 6000 && !answerPlayed) { // 答えが未再生
        // 答えを読むまでの時間が3秒/6秒
        setTimeout(function(){
            // 答え再生済みフラグを立てる
            answerPlayed = true;

            // 選択した時間待機して再生
            audioPlay(playListA[counter - 1]);
            return;
        },readAnswerInterval());

    } else if(readAnswerInterval() == 'm' && !answerPlayed) { // 答えが未再生
        // 手動の場合は答えを読むボタンのクリックイベントで再生
        return;

    } else if(readAnswerInterval() != 0 && answerPlayed) { // 答えが再生済み
        // 答え再生済みフラグを折る
        answerPlayed = false;
        // 答えが再生済みであれば繰り返し再生処理へ
        repeatPlay(playListQ);
        return;
    }
});