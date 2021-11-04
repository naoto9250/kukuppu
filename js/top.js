/**
 * 読み上げページへのリンクに選択したボタンに応じたパラメータを追加する
 */
// 各ボタンを取得
const btn_sort_all = document.getElementsByClassName('btn_sort'); // よみかたをえらぼう！の選択ボタン全て
const step_btn_all = document.getElementsByClassName('btn_step'); // よむだんをえらぼう！の選択ボタン全て

// ”よみかたをえらぼう！”で選択
for(let i = 0; i < btn_sort_all.length; i++) {
    btn_sort_all[i].addEventListener('click', function(){
        [].forEach.call(btn_sort_all, function(elem) {
            elem.classList.remove('btn_active01');
        })
        btn_sort_all[i].classList.add('btn_active01');
    });
}

// ”よむだんをえらぼう！”で選択
for(let i = 0; i < step_btn_all.length; i++) {
    step_btn_all[i].addEventListener('click', function(){
        [].forEach.call(step_btn_all, function(elem) {
            elem.classList.remove('btn_active02');
        }) 
        step_btn_all[i].classList.add('btn_active02');
    });
}

/**
 * 次へボタン押下時に選択したボタンに応じたパラメータの付与しリンクを飛ばす
 */
const next_btn = document.getElementById('link_audio');
const random = document.getElementById('read_random');
const all = document.getElementById('read_all');
const step_all = document.getElementById('step_all');
const step_1 = document.getElementById('step_1-3');
const step_4 = document.getElementById('step_4-6');
const step_7 = document.getElementById('step_7-9');
let param = '';

next_btn.addEventListener('click', function(){
    // よみかたをえらぼう！
    if(random.classList.contains('btn_active01')) {
        param = '?read=random';
    } else if(all.classList.contains('btn_active01')) {
        param = '?read=all';
    }

    // よむだんをえらぼう！
    if(step_all.classList.contains('btn_active02')) {
        param += '&step=all';
    } else if(step_1.classList.contains('btn_active02')) {
        param += '&step=1';
    } else if(step_4.classList.contains('btn_active02')) {
        param += '&step=4';
    } else if(step_7.classList.contains('btn_active02')) {
        param += '&step=7';
    }
    window.location.href = location.href + 'play.html' + param;
});