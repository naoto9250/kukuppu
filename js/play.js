// 「つぎへ」ボタン
const btn_next = document.querySelector("#to_next");
// 「もう1回きく」ボタン
const btn_repeat = document.querySelector("#btn_repeat");
// 一つ前に戻るボタン
const btn_back = document.querySelector("#back");
// 「はじめる」&「とめる」ボタン
const play_pause = document.querySelector("#play_pause");
// 次の九九再生までの待機時間中か判定用
let isInterval = false;
// 答えを読むボタン
const btn_a  = document.querySelector("#read_answer");
// 再生する音声ファイルのパス
let path;
// 答えが再生済みか判定用
let answerPlayed = false;
// 遅延実行処理格納用
var timeoutFunc = null;

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
    audio.pause();
    // 次を読むまでの時間を取得
    let next_time = $('#next_time .select').data('next');
    if(next_time == 'manual') {
        // 手動
        return;
    } else if(next_time == 1000 || next_time == 5000 || next_time == 10000) {
        // 5秒、10秒、1秒の場合
        timeoutFunc = setTimeout(function () {

            // 答え再生済みフラグを折る
            answerPlayed = false;

            // 再生数カウンターを一つ上げる
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
            
            // 音声を再生
            audioPlay(voiceData[counter - 1].VoiceUrl);

        }, next_time);
    }
}

/**
 * setTimeoutをキャンセルする
 */
function clearGlobalTimeoutFunc() {
    if (timeoutFunc !== null) {

        // setTimeout() メソッドの動作をキャンセルする
        clearTimeout(timeoutFunc);

        timeoutFunc = null;
    }
}

/**
 * 配列のシャッフル
 */
function sortRandom(array) {
    for(var i = (array.length - 1); 0 < i; i--){
        // 0〜(i+1)の範囲で値を取得
        var r = Math.floor(Math.random() * (i + 1));
        // 要素の並び替えを実行
        var tmp = array[i];
        array[i] = array[r];
        array[r] = tmp;
    }
    return array;
}

/**
 * 再生数カウンター
 */
function playCounter() {
    counter++;
    if(!voiceList.length) {
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
// 音声データリストの格納用
var voiceData;
// 取得したJsonデータの格納用
var voiceList;

function init(urlList) {
    voiceList = urlList;
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
    switch (getParam('sort')) {
        // 順番に読む
        case 'order':
            //  答えを読むまでの時間「つづけて」
            if(readAnswerInterval() == 0) {
                //  音声リストを取得
                switch (getParam('step')) {
                    case '1':
                        // 1〜3の段の音声を取得し再生
                        voiceData = voiceList.filter(voiceList => voiceList.type === 'qa' && voiceList.StepGroup === 1);
                        audioPlay(voiceData[counter - 1].VoiceUrl);
                        break;
                    case '4':
                        // ４〜6の段の音声を取得し再生
                        voiceData = voiceList.filter(voiceList => voiceList.type === 'qa' && voiceList.StepGroup === 4);
                        audioPlay(voiceData[counter - 1].VoiceUrl);
                            break;
                    case '7':
                        // ７〜9の段音声を取得し再生
                        voiceData = voiceList.filter(voiceList => voiceList.type === 'qa' && voiceList.StepGroup === 7);
                        audioPlay(voiceData[counter - 1].VoiceUrl);
                            break;
                    default:
                        // 全ての段の音声を再生
                        voiceData = voiceList.filter(voiceList => voiceList.type === 'qa');
                        audioPlay(voiceData[counter - 1].VoiceUrl);
                            break;
                }

            }
            // 問題と答えの音声ファイルを別々に取得
            else if(readAnswerInterval() == 3000 || readAnswerInterval() == 6000 || readAnswerInterval() == 'm') { // 答えを読むまでの時間「3,6秒,手動」
                //  音声リストを取得
                switch (getParam('step')) {
                    case '1':
                        // 1〜3の段の音声を取得し再生
                        voiceData = voiceList.filter(voiceList => voiceList.type === 'q' && voiceList.StepGroup === 1);
                        audioPlay(voiceData[counter - 1].VoiceUrl);
                        break;
                    case '4':
                        // ４〜6の段の音声を取得し再生
                        voiceData = voiceList.filter(voiceList => voiceList.type === 'q' && voiceList.StepGroup === 4);
                        audioPlay(voiceData[counter - 1].VoiceUrl);
                            break;
                    case '7':
                        // ７〜9の段音声を取得し再生
                        voiceData = voiceList.filter(voiceList => voiceList.type === 'q' && voiceList.StepGroup === 7);
                        audioPlay(voiceData[counter - 1].VoiceUrl);
                            break;
                    default:
                        // 全ての段の音声を再生
                        voiceData = voiceList.filter(voiceList => voiceList.type === 'q');
                        audioPlay(voiceData[counter - 1].VoiceUrl);
                            break;
                }
    
            }
            break;

        // ランダム（デフォルト）
        default:
            //  答えを読むまでの時間「つづけて」
            if(readAnswerInterval() == 0) {
                //  音声リストを取得
                switch (getParam('step')) {
                    case '1':
                        // 1〜3の段の音声を取得しランダム再生
                        voiceData = voiceList.filter(voiceList => voiceList.type === 'qa' && voiceList.StepGroup === 1);
                        sortRandom(voiceData);
                        audioPlay(voiceData[counter - 1].VoiceUrl);
                        break;
                    case '4':
                        // ４〜6の段の音声を取得しランダム再生
                        voiceData = voiceList.filter(voiceList => voiceList.type === 'qa' && voiceList.StepGroup === 4);
                        sortRandom(voiceData);
                        audioPlay(voiceData[counter - 1].VoiceUrl);
                            break;
                    case '7':
                        // ７〜9の段音声を取得しランダム再生
                        voiceData = voiceList.filter(voiceList => voiceList.type === 'qa' && voiceList.StepGroup === 7);
                        sortRandom(voiceData);
                        audioPlay(voiceData[counter - 1].VoiceUrl);
                            break;
                    default:
                        // 全ての段の音声を取得しランダム再生
                        voiceData = voiceList.filter(voiceList => voiceList.type === 'qa');
                        sortRandom(voiceData);
                        audioPlay(voiceData[counter - 1].VoiceUrl);
                            break;
                }
    
            }
            // 問題と答えの音声ファイルを別々に取得
            else if(readAnswerInterval() == 3000 || readAnswerInterval() == 6000 || readAnswerInterval() == 'm') { // 答えを読むまでの時間「3,6秒,手動」
                //  音声リストを取得
                switch (getParam('step')) {
                    case '1':
                        // 1〜3の段の音声を取得しランダム再生
                        voiceData = voiceList.filter(voiceList => voiceList.type === 'q' && voiceList.StepGroup === 1);
                        sortRandom(voiceData);
                        audioPlay(voiceData[counter - 1].VoiceUrl);
                        break;
                    case '4':
                        // ４〜6の段の音声を取得しランダム再生
                        voiceData = voiceList.filter(voiceList => voiceList.type === 'q' && voiceList.StepGroup === 4);
                        sortRandom(voiceData);
                        audioPlay(voiceData[counter - 1].VoiceUrl);
                            break;
                    case '7':
                        // ７〜9の段音声を取得しランダム再生
                        voiceData = voiceList.filter(voiceList => voiceList.type === 'q' && voiceList.StepGroup === 7);
                        sortRandom(voiceData);
                        audioPlay(voiceData[counter - 1].VoiceUrl);
                            break;
                    default:
                        // 全ての段の音声を取得しランダム再生
                        voiceData = voiceList.filter(voiceList => voiceList.type === 'q');
                        sortRandom(voiceData);
                        audioPlay(voiceData[counter - 1].VoiceUrl);
                            break;
                }
    
            }
            break;
    }
}

/**
 * 各ボタンのクリックイベント
 */
// ”つぎへ”ボタン
btn_next.addEventListener("click", ()=>{
    // 再生数カウンター
    playCounter();

    audio.pause();
    
    //setTimeoutの初期化
    clearGlobalTimeoutFunc();

    // 繰り返しカウンターを初期化
    repeatCounter = 0;

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

    if(readAnswerInterval() != 0) {
        // 問題と答えが別々の場合は答え再生済みフラグを折る
        answerPlayed = false;
        audioPlay(voiceData[counter - 1].VoiceUrl);
    } else if(readAnswerInterval() == 0) {
        // 問題と答えがセット
        audioPlay(voiceData[counter - 1].VoiceUrl);
    }
});

// もう1回聞くボタン
btn_repeat.addEventListener("click", ()=>{
    //setTimeoutの初期化
    clearGlobalTimeoutFunc();
    
    // 繰り返しカウンターを初期化
    repeatCounter = 0;

    audio.currentTime = 0;
    if(readAnswerInterval() != 0) {
        // 問題と答えが別々の場合
        answerPlayed = false;
        audioPlay(voiceData[counter - 1].VoiceUrl);
    } else if(readAnswerInterval() == 0) {
        // 問題と答えがセット
        audioPlay(voiceData[counter - 1].VoiceUrl);
    }
    return;
});

// 一つ前に戻るボタン
btn_back.addEventListener("click", ()=>{
    //setTimeoutの初期化
    clearGlobalTimeoutFunc();
    
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
            audioPlay(voiceData[counter - 1].VoiceUrl);
        } else if(readAnswerInterval() == 0) {
            // 問題と答えがセット
            audioPlay(voiceData[counter - 1].VoiceUrl);
        }
    }
    return;
});

// ”とめる”、”はじめる”ボタン
play_pause.addEventListener("click", ()=>{
    //setTimeoutの初期化
    clearGlobalTimeoutFunc();

    // 再生中に一時停止ボタンを押した場合（pausedがtrue=>停止, false=>再生中）
    if(!audio.paused){
        isInterval = false;

        play_pause.innerHTML = '<div class="img_play"><img src="./img/btn-play02.png" alt="はじめる"></div>';

        audio.pause();
    }

    // 次の九九再生までの待機時間中に止めるボタンを押した場合
    else if(audio.paused && isInterval && play_pause.innerHTML == '<div class="btn_pause"><img src="./img/btn-pause.png" alt="とめる"></div>') {

        play_pause.innerHTML = '<div class="img_play"><img src="./img/btn-play02.png" alt="はじめる"></div>';

        audio.pause();
    }

    // 次の九九再生までの待機時間中に始めるボタンを押した場合
    else if(audio.paused && isInterval && play_pause.innerHTML == '<div class="img_play"><img src="./img/btn-play02.png" alt="はじめる"></div>') {

        isInterval = false;
        
        play_pause.innerHTML = '<div class="btn_pause"><img src="./img/btn-pause.png" alt="とめる"></div>';

        // 問題と答えがセットの場合
        if(readAnswerInterval() == 0) {
            repeatVoice(voiceData[counter - 1].VoiceUrl);
        }
        
        // 問題と答えを別々に読む場合
        if(readAnswerInterval() == 3000 && !answerPlayed || readAnswerInterval() == 6000 && !answerPlayed) { // 答えが未再生
            // 答えのURLに変換
            var a = voiceData[counter - 1].VoiceUrl.replace('/q/q', '/a/a');

            // 答えを読むまでの時間が3秒/6秒
            timeoutFunc = setTimeout(function () {
                // 答え再生済みフラグを立てる
                answerPlayed = true;

                // 選択した時間待機して再生
                audioPlay(a);
                return;
            }, readAnswerInterval());

        } else if(readAnswerInterval() == 'm' && !answerPlayed) { // 答えが未再生
            // 手動の場合は答えを読むボタンのクリックイベントで再生
            return;

        } else if(readAnswerInterval() != 0 && answerPlayed) { // 答えが再生済み
            // 答え再生済みフラグを折る
            answerPlayed = false;
            
            // 答えが再生済みであれば繰り返し再生処理へ
            repeatVoice(voiceData[counter - 1].VoiceUrl);
            return;
        }
    }

    // 一時停止中の場合
    else if(audio.paused) {

        isInterval = false;
        
        play_pause.innerHTML = '<div class="btn_pause"><img src="./img/btn-pause.png" alt="とめる"></div>';

        audio.play();
    }
});

// 答えを読むボタン
btn_a.addEventListener("click", ()=>{
    //setTimeoutの初期化
    clearGlobalTimeoutFunc();

    // 答えのURLに変換
    var a = voiceData[counter - 1].VoiceUrl.replace('/q/q', '/a/a');

    // 答え再生済みフラグを立てる
    answerPlayed = true;
    // 答えを再生
    audioPlay(a);
    
    return;
});

/**
 * 繰り返し再生
 */
function repeatVoice(repeatData) {
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
        answerPlayed = false;
        // 2回または3回再生
        audio.currentTime = 0;
        timeoutFunc = setTimeout(function () {
            audioPlay(repeatData);
        }, 1000);
        
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

    // 「一時停止ボタン」に切り替え
    play_pause.innerHTML = '<div class="btn_pause"><img src="./img/btn-pause.png" alt="とめる"></div>';
    isInterval = true;

    // 問題と答えがセットの場合
    if(readAnswerInterval() == 0) {
        repeatVoice(voiceData[counter - 1].VoiceUrl);
    }

    // 問題と答えを別々に読む場合
    if(readAnswerInterval() == 3000 && !answerPlayed || readAnswerInterval() == 6000 && !answerPlayed) { // 答えが未再生
        // 答えのURLに変換
        var a = voiceData[counter - 1].VoiceUrl.replace('/q/q', '/a/a');

        // 答えを読むまでの時間が3秒/6秒
        timeoutFunc = setTimeout(function () {
            // 答え再生済みフラグを立てる
            answerPlayed = true;

            // 選択した時間待機して再生
            audioPlay(a);
            return;
        }, readAnswerInterval());

    } else if(readAnswerInterval() == 'm' && !answerPlayed) { // 答えが未再生
        // 手動の場合は答えを読むボタンのクリックイベントで再生
        return;

    } else if(readAnswerInterval() != 0 && answerPlayed) { // 答えが再生済み
        // 答えが再生済みであれば繰り返し再生処理へ
        repeatVoice(voiceData[counter - 1].VoiceUrl);
        return;
    }
});