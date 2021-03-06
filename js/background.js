﻿/**
 * @author: GuoLei Sun
 * @date:   20180902
 *
 * 网页上划词和双击选词显示的弹出框
 */

console.log("0. background first execution");

// 默认设置
let DefaultOptions = {
    "dict_disable": ["checked", false],
    "ctrl_only": ["checked", false],
    "english_only": ["checked", true],
    "autoplay": ["checked", false],
    "playwhenhovering": ["checked", true],
    "playwhenclicking": ["checked", false]
};

// 如果 localStorage 没有存储设置，则初始化默认的设置
if (localStorage["ColorOptions"] === undefined) {
    localStorage["ColorOptions"] = JSON.stringify(DefaultOptions);
}

// var DictTranslate = {
//     "return-phrase": "",
//     "lang": "",
//     "translation": []
// };
// var startupOptions = JSON.parse(localStorage["ColorOptions"]);
let ColorsChanged = true;

// 初始化图标状态，划词翻译关闭，则显示带叉的图标 image/icon_no_dict.png
initIcon();

// 初始化弹出框的图标
function initIcon() {
    // 如果本地存储的变量值 关闭划词翻译 dict_disable 为 true，就设置关闭图标 image/icon_no_dict.png
    let localOptions = JSON.parse(localStorage["ColorOptions"]);
    if (localOptions['dict_disable'][1] === true) {
        // 通过 chrome 的接口设置图标图片
        chrome.browserAction.setIcon({
            path: "image/icon_no_dict.png"
        })
    }
}

sprintfWrapper = {

    init: function () {

        if (typeof arguments == "undefined") {
            return null;
        }
        if (arguments.length < 1) {
            return null;
        }
        if (typeof arguments[0] != "string") {
            return null;
        }
        if (typeof RegExp == "undefined") {
            return null;
        }

        var string = arguments[0];
        var exp = new RegExp(/(%([%]|(\-)?(\+|\x20)?(0)?(\d+)?(\.(\d)?)?([bcdfosxX])))/g);
        var matches = new Array();
        var strings = new Array();
        var convCount = 0;
        var stringPosStart = 0;
        var stringPosEnd = 0;
        var matchPosEnd = 0;
        var newString = '';
        var match = null;

        while (match = exp.exec(string)) {
            if (match[9]) {
                convCount += 1;
            }

            stringPosStart = matchPosEnd;
            stringPosEnd = exp.lastIndex - match[0].length;
            strings[strings.length] = string.substring(stringPosStart, stringPosEnd);

            matchPosEnd = exp.lastIndex;
            matches[matches.length] = {
                match: match[0],
                left: match[3] ? true : false,
                sign: match[4] || '',
                pad: match[5] || ' ',
                min: match[6] || 0,
                precision: match[8],
                code: match[9] || '%',
                negative: parseInt(arguments[convCount]) < 0 ? true : false,
                argument: String(arguments[convCount])
            };
        }
        strings[strings.length] = string.substring(matchPosEnd);

        if (matches.length == 0) {
            return string;
        }
        if ((arguments.length - 1) < convCount) {
            return null;
        }

        var code = null;
        var match = null;
        var i = null;

        for (i = 0; i < matches.length; i++) {

            if (matches[i].code == '%') {
                substitution = '%'
            }
            else if (matches[i].code == 'b') {
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(2));
                substitution = sprintfWrapper.convert(matches[i], true);
            }
            else if (matches[i].code == 'c') {
                matches[i].argument = String(String.fromCharCode(parseInt(Math.abs(parseInt(matches[i].argument)))));
                substitution = sprintfWrapper.convert(matches[i], true);
            }
            else if (matches[i].code == 'd') {
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)));
                substitution = sprintfWrapper.convert(matches[i]);
            }
            else if (matches[i].code == 'f') {
                matches[i].argument = String(Math.abs(parseFloat(matches[i].argument)).toFixed(matches[i].precision ? matches[i].precision : 6));
                substitution = sprintfWrapper.convert(matches[i]);
            }
            else if (matches[i].code == 'o') {
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(8));
                substitution = sprintfWrapper.convert(matches[i]);
            }
            else if (matches[i].code == 's') {
                matches[i].argument = matches[i].argument.substring(0, matches[i].precision ? matches[i].precision : matches[i].argument.length)
                substitution = sprintfWrapper.convert(matches[i], true);
            }
            else if (matches[i].code == 'x') {
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(16));
                substitution = sprintfWrapper.convert(matches[i]);
            }
            else if (matches[i].code == 'X') {
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(16));
                substitution = sprintfWrapper.convert(matches[i]).toUpperCase();
            }
            else {
                substitution = matches[i].match;
            }

            newString += strings[i];
            newString += substitution;

        }
        newString += strings[i];

        return newString;

    },

    convert: function (match, nosign) {
        if (nosign) {
            match.sign = '';
        } else {
            match.sign = match.negative ? '-' : match.sign;
        }
        let l = match.min - match.argument.length + 1 - match.sign.length;
        let pad = new Array(l < 0 ? 0 : l).join(match.pad);
        if (!match.left) {
            if (match.pad == "0" || nosign) {
                return match.sign + pad + match.argument;
            } else {
                return pad + match.sign + match.argument;
            }
        } else {
            if (match.pad == "0" || nosign) {
                return match.sign + match.argument + pad.replace(/0/g, ' ');
            } else {
                return match.sign + match.argument + pad;
            }
        }
    }
};

sprintf = sprintfWrapper.init;

// 添加插件监听器
chrome.extension.onRequest.addListener(
    function (request, sender, sendResponse) {
        if (request.init === "init" && ColorsChanged === true) {
            sendResponse({
                init: "globalPages",
                ChangeColors: "true",
                ColorOptions: localStorage["ColorOptions"]
            });
        }
    }
);

// 生成表格
function genTable(word, strpho, baseTrans, webTrans) {
    // 查询的语言
    let lan = '';
    // 韩文
    if (isContainKorea(word)) {
        lan = "&le=ko";
    }
    // 日文
    if (isContainJapanese(word)) {
        lan = "&le=jap";
    }

    let title = word;
    if ((isContainChinese(title) || isContainJapanese(title) || isContainKorea(title)) && title.length > 15) {
        title = title.substring(0, 10) + '...';
    }
    if (title.length > 25) {
        title = title.substring(0, 15) + ' ...';
    }
    let fmt = '';
    // 既没有基本释义，也没有网络释义
    if (noBaseTrans && noWebTrans) {
        fmt = '<div id="yddContainer" align=left style="padding:0 0 0 0;">' +
            '   <div id="yddTop" class="ydd-sp">' +
            '       <div id="yddTopBorderlr">' +
            '           <a href="http://dict.youdao.com/search?q=' + encodeURIComponent(word) +
            '&keyfrom=chrome.extension' + lan +
            '" title="查看完整释义" class="ydd-sp ydd-icon" style="padding: 17px 0 0;" target=_blank></a>' +
            ' <a href="http://dict.youdao.com/search?q=' + encodeURIComponent(word) +
            '&keyfrom=chrome.extension' + lan + '" target=_blank title="查看完整释义" id="yddKeyTitle">' +
            title + '</a>&nbsp;<span style="font-weight: normal;font-size: 10px;">' + strpho +
            '</span>' +
            '<span style="float:right;font-weight:normal;font-size:10px">' +
            '<a href="http://www.youdao.com/search?q=' + encodeURIComponent(word) +
            '&ue=utf8&keyfrom=chrome.extension" target=_blank>详细</a>' +
            '</span>' +
            '<a id="test">' +
            '<span class="ydd-sp ydd-close">X</span>' +
            '</a>' +
            '</div>' +
            '</div>' +
            '    <div id="yddMiddle">';
    } else {
        fmt = '<div id="yddContainer" align=left style="padding:0 0 0 0;">' +
            '    <div id="yddTop" class="ydd-sp">' +
            '<div id="yddTopBorderlr">' +
            '<a href="http://dict.youdao.com/search?q=' + encodeURIComponent(word) + '&keyfrom=chrome.extension' +
            lan +
            '" title="查看完整释义" class="ydd-sp ydd-icon" style="padding: 17px 0 0;" target=_blank>' +
            '</a> <a href="http://dict.youdao.com/search?q=' + encodeURIComponent(word) + '&keyfrom=chrome.extension' +
            lan +
            '" target=_blank title="查看完整释义" id="yddKeyTitle">' +
            title +
            '</a>&nbsp;<span style="font-weight:normal;font-size:10px;">' +
            strpho +
            '&nbsp;&nbsp;</span><span id="voice" style="padding:2px;height:15px;width:15px">' +
            speach +
            '</span>' +
            '<span style="float:right;font-weight:normal;font-size:10px">' +
            '<a href="http://dict.youdao.com/search?q=' + encodeURIComponent(word) + '&keyfrom=chrome.extension' +
            lan +
            '" target=_blank>详细</a></span><a id="test"><span class="ydd-sp ydd-close">X</span></a></div></div>' +
            '    <div id="yddMiddle">';
    }
    if (noBaseTrans === false) {
        let base =
            '  <div class="ydd-trans-wrapper" style="display:block;padding:0 0 0 0" id="yddSimpleTrans">' +
            '        <div class="ydd-tabs"><span class="ydd-tab">基本翻译</span></div>' +
            '        %s' +
            '	</div>';
        base = sprintf(base, baseTrans);
        fmt += base;
    }
    if (noWebTrans === false) {
        let web =
            '       <div class="ydd-trans-wrapper" style="display:block;padding:0 0 0 0">' +
            '        <div class="ydd-tabs"><span class="ydd-tab">网络释义</span></div>' +
            '        %s' +
            '      </div>';
        web = sprintf(web, webTrans);
        fmt += web;
    }
    if (noBaseTrans && noWebTrans) {
        fmt += '&nbsp;&nbsp;没有英汉互译结果<br/>&nbsp;&nbsp;<a href="http://www.youdao.com/search?q=' +
            encodeURIComponent(word) + '&ue=utf8&keyfrom=chrome.extension" target=_blank>请尝试网页搜索</a>';
    }
    fmt += '   </div>' +
        '  </div>';

    res = fmt;
    noBaseTrans = false;
    noWebTrans = false;
    speach = '';
    //alert(res);
    return res;
}

let noBaseTrans = false;
let noWebTrans = false;
let speach = '';
let retphrase = "";

function translateXML(xmlNode) {
    // var translate = "<strong>查询:</strong><br/>";
    let root = xmlNode.getElementsByTagName("yodaodict")[0];

    if ("" + root.getElementsByTagName("return-phrase")[0].childNodes[0] != "undefined")
        retphrase = root.getElementsByTagName("return-phrase")[0].childNodes[0].nodeValue;

    if ("" + root.getElementsByTagName("dictcn-speach")[0] != "undefined")
        speach = root.getElementsByTagName("dictcn-speach")[0].childNodes[0].nodeValue;

    let lang = "&le=";
    let strpho = "";
    let pho = "";

    if ("" + root.getElementsByTagName("lang")[0] != "undefined")
        lang += root.getElementsByTagName("lang")[0].childNodes[0].nodeValue;
    if ("" + root.getElementsByTagName("phonetic-symbol")[0] != "undefined") {
        if ("" + root.getElementsByTagName("phonetic-symbol")[0].childNodes[0] != "undefined")
            pho = root.getElementsByTagName("phonetic-symbol")[0].childNodes[0].nodeValue;

        if (pho != null) {
            strpho = "&nbsp;[" + pho + "]";
        }
    }

    if ("" + root.getElementsByTagName("translation")[0] == "undefined") {
        noBaseTrans = true;
    }
    if ("" + root.getElementsByTagName("web-translation")[0] == "undefined") {
        noWebTrans = true;
    }

    let basetrans = "";
    let webtrans = "";
    let translations;
    let webtranslations;

    if (noBaseTrans === false) {
        if ("" + root.getElementsByTagName("translation")[0].childNodes[0] != "undefined") {
            translations = root.getElementsByTagName("translation");
        } else {
            noBaseTrans = true;
        }
        for (let i = 0; i < translations.length - 1; i++) {
            basetrans += '<div class="ydd-trans-container ydd-padding010">' + translations[i].getElementsByTagName("content")[0].childNodes[0].nodeValue + "</div>";
            // basetrans += '<div class="ydd-trans-container ydd-padding010">' + translations[i].getElementsByTagName("content")[0].childNodes[0].nodeValue + "</div>";
        }
    }

    if (noWebTrans === false) {
        if ("" + root.getElementsByTagName("web-translation")[0].childNodes[0] != "undefined") {
            webtranslations = root.getElementsByTagName("web-translation");
        } else {
            noWebTrans = true;
        }
        for (let i = 0; i < webtranslations.length - 1; i++) {
            webtrans += '<div class="ydd-trans-container ydd-padding010"><a href="http://dict.youdao.com/search?q=' + encodeURIComponent(webtranslations[i].getElementsByTagName("key")[0].childNodes[0].nodeValue) + '&keyfrom=chrome.extension' + lang + '" target=_blank>' + webtranslations[i].getElementsByTagName("key")[0].childNodes[0].nodeValue + ":</a> ";
            webtrans += webtranslations[i].getElementsByTagName("trans")[0].getElementsByTagName("value")[0].childNodes[0].nodeValue + "<br /></div>";
        }
    }
    return genTable(retphrase, strpho, basetrans, webtrans);
    //return translate;
}


function translateTransXML(xmlNode) {
    let s = xmlNode.indexOf("CDATA[");
    let e = xmlNode.indexOf("]]");
    let input_str = xmlNode.substring(s + 6, e);

    let remain = xmlNode.substring(e + 2, xmlNode.length - 1);
    s = remain.indexOf("CDATA[");
    e = remain.indexOf("]]");
    let trans_str = remain.substring(s + 6, e);

    let trans_str_tmp = trans_str.replace(/^\s*/, "").replace(/\s*$/, "");
    let input_str_tmp = input_str.replace(/^\s*/, "").replace(/\s*$/, "");

    if ((isContainChinese(input_str_tmp) || isContainJapanese(input_str_tmp) || isContainKorea(input_str_tmp))
        && input_str_tmp.length > 15) {
        input_str_tmp = input_str_tmp.substring(0, 8) + ' ...';
    } else if (input_str_tmp.length > 25) {
        input_str_tmp = input_str_tmp.substring(0, 15) + ' ...';
    }

    if (trans_str_tmp === input_str_tmp) return null;

    let res = '<div id="yddContainer" align=left style="padding:0 0 0 0;" >' +
        '    <div id="yddTop" class="ydd-sp"><div id="yddTopBorderlr">' +
        '<a href="http://fanyi.youdao.com/translate?i=' + encodeURIComponent(input_str) +
        '&keyfrom=chrome" class="ydd-sp ydd-icon" style="padding: 17px 0 0;" target=_blank">有道词典</a>' +
        '<div style="font-weight:normal;display: inline;">'
        + input_str_tmp.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, "&quot;").replace(/'/g, "&#39;") +
        '</div><span style="float:right;font-weight:normal;font-size:10px">' +
        '<a href="http://fanyi.youdao.com/translate?i=' + encodeURIComponent(input_str) +
        '&smartresult=dict&keyfrom=chrome.extension" target=_blank>详细</a>' +
        '</span><a id="test"><span class="ydd-sp ydd-close">X</span></a></div></div>' +
        '    <div id="yddMiddle">' +
        '      <div class="ydd-trans-wrapper" id="yddSimpleTrans">' +
        '        <div class="ydd-trans-container ydd-padding010">' +
        trans_str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, "&quot;").replace(/'/g, "&#39;")
        + '</div>' +
        '      ' +
        '	</div>' +
        '   </div>' +
        '  </div>';

    return res;
}

function fetchWordWithoutDeskDict(word, callback) {
    let lang = '';
    if (isContainKorea(word)) {
        lang = '&le=ko';
    }
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {

                let dataText = translateXML(xhr.responseXML);
                if (dataText != null)
                    callback(dataText);
            } else {
                //callback(null);
            }
        }
    };
    let url = 'http://dict.youdao.com/fsearch?client=deskdict&keyfrom=chrome.extension&q=' + encodeURIComponent(word)
        + '&pos=-1&doctype=xml&xmlVersion=3.2&dogVersion=1.0&vendor=unknown&appVer=3.1.17.4208&le=eng';

    xhr.open('GET', url, true);
    xhr.send();
}

let _word;
let _callback;
let _timer;

// 判断是否是中文
function isChinese(temp) {
    let re = /[^\u4e00-\u9fa5]/;
    return !re.test(temp);

}

// 判断是否是日文
function isJapanese(temp) {
    let re = /[^\u0800-\u4e00]/;
    return !re.test(temp);

}

// 判断是否是韩文
function isKorea(str) {
    for (let i = 0; i < str.length; i++) {
        if (((str.charCodeAt(i) > 0x3130 && str.charCodeAt(i) < 0x318F) || (str.charCodeAt(i) >= 0xAC00 && str.charCodeAt(i) <= 0xD7A3))) {
            return true;
        }
    }
    return false;
}

// 判断是否包含韩文
function isContainKorea(temp) {
    let cnt = 0;
    for (let i = 0; i < temp.length; i++) {
        if (isKorea(temp.charAt(i)))
            cnt++;
    }
    return cnt > 0;

}

// 判断是否包含中文
function isContainChinese(temp) {
    let cnt = 0;
    for (let i = 0; i < temp.length; i++) {
        if (isChinese(temp.charAt(i)))
            cnt++;
    }
    return cnt > 5;
}

// 判断是否包含日文
function isContainJapanese(word) {
    let cnt = 0;
    for (let i = 0; i < word.length; i++) {
        if (isJapanese(word.charAt(i)))
            cnt++;
    }
    return cnt > 2;
}

// function fetchWord(word, callback) {
//     if (isContainKorea(word)) {
//         fetchWordWithoutDeskDict(word, callback);
//         return;
//     }
//     var xhr = new XMLHttpRequest();
//     _word = word;
//     _callback = callback;
//     xhr.onreadystatechange = function (data) {
//         clearTimeout(_timer);
//     }
//     var url = 'http://127.0.0.1:8999/word=' + word + '&';
//     xhr.open('GET', url, true);
//     xhr.send();
//     _timer = setTimeout(handleTimeout, 600);
// }

// function handleTimeout() {
//     fetchWordWithoutDeskDict(_word, _callback);
// }

function onRequest(request, sender, callback) {

    if (request.action === 'dict') {
        if (navigator.appVersion.indexOf("Win") !== -1) {
            fetchWordWithoutDeskDict(request.word, callback);
        } else {
            fetchWordWithoutDeskDict(request.word, callback);
        }
    }
    if (request.action === 'translate') {
        fetchTranslate(request.word, callback);
    }
}

function fetchTranslate(words, callback) {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                let dataText = translateTransXML(xhr.responseText);
                if (dataText != null)
                    callback(dataText);
            } else {
                //callback(null);
            }
        }
    };
    let url = "http://fanyi.youdao.com/translate?" +
        "client=deskdict&keyfrom=chrome.extension&xmlVersion=1.1&dogVersion=1.0&ue=utf8&i=" +
        encodeURIComponent(words) + "&doctype=xml";
    xhr.open('GET', url, true);
    xhr.send();
}

chrome.extension.onRequest.addListener(onRequest);