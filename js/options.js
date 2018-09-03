/**
 * @author  DongXu Huang
 * @date    2010-2-21
 *
 * @author  GuoLei Sun
 * @date    20180902
 *
 * 浏览器右上角扩展图标点击后显示的弹出框
 */
// 初始化设置
let Options = {
    "dict_disable": ["checked", false],
    "ctrl_only": ["checked", false],
    "english_only": ["checked", true],
    "autoplay": ["checked", false],
    "playwhenhovering": ["checked", true],
    "playwhenclicking": ["checked", false]
};

function close() {
    window.self.close();
}

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
        if ((str.charCodeAt(i) > 0x3130 && str.charCodeAt(i) < 0x318F) ||
            (str.charCodeAt(i) >= 0xAC00 && str.charCodeAt(i) <= 0xD7A3)) {
            return true;
        }
    }
    return false;
}

// 判断是否包含韩文
function isContainKorea(word) {
    let cnt = 0;
    for (let i = 0; i < word.length; i++) {
        if (isKorea(word.charAt(i)))
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

let retphrase = "";
// 语言类型
let langType = '';
// 基本释义
let basetrans = "";
// 网络释义
let webtrans = "";
// 没有基本释义的 flag
let noBaseTrans = false;
// 没有 web 释义的 flag
let noWebTrans = false;
// 搜索的字符串
let _word;

// 搜索查询入口
function mainQuery(word, callback) {
    // ajax 请求
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                // 成功返回后处理 xml
                translateXML(xhr.responseXML);
                // let dataText = translateXML(xhr.responseXML);
                // if (dataText != null)
                //     callback(dataText);
            }
        }
    };
    _word = word;
    // 请求的翻译 api 地址
    let url = 'http://dict.youdao.com/fsearch?client=deskdict&keyfrom=chrome.extension&q=' + encodeURIComponent(word) + '&pos=-1&doctype=xml&xmlVersion=3.2&dogVersion=1.0&vendor=unknown&appVer=3.1.17.4208&le=eng'
    xhr.open('GET', url, true);
    xhr.send();
}

// 解析返回的 xml 文件
function translateXML(xmlNode) {
    // 存放解析返回 xml 为 html 的变量 translate
    let translate = "<strong>查询:</strong><br/>";
    // root 根元素
    // <yodaodict>
    let root = xmlNode.getElementsByTagName("yodaodict")[0];

    // <return-phrase>
    if ("" + root.getElementsByTagName("return-phrase")[0].childNodes[0] != "undefined")
        retphrase = root.getElementsByTagName("return-phrase")[0].childNodes[0].nodeValue;

    // <lang>eng</lang>
    if ("" + root.getElementsByTagName("lang")[0] != "undefined") {
        langType = root.getElementsByTagName("lang")[0].childNodes[0].nodeValue;
    }

    let strpho = "";
    // 发音 phonetic
    let pho = "";

    // <phonetic-symbol>
    if ("" + root.getElementsByTagName("phonetic-symbol")[0] != "undefined") {
        if ("" + root.getElementsByTagName("phonetic-symbol")[0].childNodes[0] != "undefined")
            pho = root.getElementsByTagName("phonetic-symbol")[0].childNodes[0].nodeValue;

        if (pho != null) {
            strpho = "&nbsp;[" + pho + "]";
        }
    }

    // <translation>
    if ("" + root.getElementsByTagName("translation")[0] == "undefined") {
        noBaseTrans = true;
    }

    // <web-translation>
    if ("" + root.getElementsByTagName("web-translation")[0] == "undefined") {
        noWebTrans = true;
    }

    // 存在基本释义
    if (noBaseTrans == false) {
        // translate += retphrase + "<br/><br/><strong>基本释义:</strong><br/>";
        basetrans += "<br/><strong>基本释义:</strong><br/>";

        let translations;
        if ("" + root.getElementsByTagName("translation")[0].childNodes[0] != "undefined")
            translations = root.getElementsByTagName("translation");
        else {
            basetrans += '未找到基本释义';
        }

        // 遍历基本释义
        for (let i = 0; i < translations.length; i++) {
            // <![CDATA[ n. 表示问候， 惊奇或唤起注意时的用语 ]]>
            let line = translations[i].getElementsByTagName("content")[0].childNodes[0].nodeValue + "<br/>";
            // 把长度超过 50 的字符串，通过中文/英文分号分割，然后换行显示
            if (line.length > 50) {
                let reg = /[;；]/;
                let children = line.split(reg);
                line = '';
                for (let j = 0; j < children.length; j++)
                    line += children[j] + "<br/>";
            }
            // 拼接所有的基本释义
            basetrans += line;

        }
    }

    // 如果存在 <web-translation>
    if (noWebTrans === false) {
        let webtranslations;
        if ("" + root.getElementsByTagName("web-translation")[0].childNodes[0] != "undefined")
            webtranslations = root.getElementsByTagName("web-translation");
        else {
            webtrans += '未找到网络释义';
        }

        // 遍历网络释义
        for (let i = 0; i < webtranslations.length; i++) {
            webtrans += webtranslations[i].getElementsByTagName("key")[0].childNodes[0].nodeValue + ":  ";
            webtrans += webtranslations[i].getElementsByTagName("trans")[0].getElementsByTagName("value")[0]
                .childNodes[0].nodeValue + "<br/>";
        }
    }

    // 处理后的 xml 内容的 html 拼接
    mainFrameQuery();
    // return;
}


// 移除当前的元素
function removeDiv(divName) {
    let div = document.getElementById(divName);
    if (div == null) return;
    div.parentNode.removeChild(div);
}

// 将 xml 解析出来的内容拼接展示
function mainFrameQuery() {
    // 移除弹出框中的各个元素，用来显示查找的单词翻译
    removeDiv('optionSetupText');
    removeDiv('underlineClosedCheckbox');
    removeDiv('instantTranslateCheckbox');
    removeDiv('onlyEnglishCheckbox');
    removeDiv('pronunciationText');
    // 判断语言
    let lan = '';
    // _word 是搜索的字符串
    // 韩文判断
    if (isContainKorea(_word)) {
        lan = "&le=ko";
    }
    // 日文判断
    if (isContainJapanese(_word)) {
        lan = "&le=jap";
    }
    // 法文判断
    if (langType === 'fr') {
        lan = "&le=fr";
    }

    // 显示翻译结果的 div
    let res = document.getElementById('result');

    // 清空旧的文本
    res.innerHTML = '';

    // 如果存在基本释义
    if (noBaseTrans === false) {
        if (langType === 'ko') {
            basetrans = "<strong>韩汉翻译:</strong><br/>" + basetrans;
        } else if (langType === 'jap') {
            basetrans = "<strong>日汉翻译:</strong><br/>" + basetrans;
        } else if (langType === 'fr') {
            basetrans = "<strong>法汉翻译:</strong><br/>" + basetrans;
        } else {
            basetrans = "<strong>英汉翻译:</strong><br/>" + basetrans;
        }
        res.innerHTML = basetrans;
    }
    // 如果存在网络释义
    if (noWebTrans === false) {
        webtrans = "<strong>网络释义:</strong><br/>" + webtrans;
        res.innerHTML += webtrans;
    }
    // 如果存在基本释义或者网络释义，则显示详细释义链接
    if (noBaseTrans === false || noWebTrans === false) {
        res.innerHTML += "<a href ='http://dict.youdao.com/search?q=" + encodeURIComponent(_word) + "&ue=utf8&keyfrom=chrome.extension" + lan + "' target=_blank>点击 查看详细释义</a>";
    }
    // 如果既没有基本释义，也没有网络释义，则显示有道搜索
    if (noBaseTrans && noWebTrans) {
        res.innerHTML = "未找到英汉翻译!";
        res.innerHTML += "<br><a href ='http://www.youdao.com/search?q=" + encodeURIComponent(_word) + "&ue=utf8&keyfrom=chrome.extension' target=_blank>尝试用有道搜索</a>";
    }
    // 重置所有变量
    retphrase = '';
    webtrans = '';
    basetrans = '';
    _word = '';
    langType = '';
    noBaseTrans = false;
    noWebTrans = false;
    document.getElementsByName('word')[0].focus();
}

// 设置变动后，保存修改后的设置
function save_options() {

    changeIcon();
    for (let key in Options) {
        if (Options[key][0] === "checked") {
            Options[key][1] = document.getElementById(key).checked;
        }
    }
    localStorage["ColorOptions"] = JSON.stringify(Options);
}

function goFeedback() {
    window.open("http://feedback.youdao.com/deskapp_report.jsp?prodtype=deskdict&ver=chrome.extension");
}

function goAbout() {
    window.open("http://cidian.youdao.com/chromeplus");
}

// 初始化弹出框的图标
function initIcon() {
    // 如果本地存储的变量值 划词翻译 为 true，就设置关闭图标
    let localOptions = JSON.parse(localStorage["ColorOptions"]);
    // console.log("123-guolei");
    if (localOptions['dict_disable'][1] === true) {
        // 通过 chrome 的接口设置图标图片
        chrome.browserAction.setIcon({
            path: "image/icon_no_dict.png"
        })
    }
}

// 判断 关闭划词翻译 checkbox 是否勾选，处理图标的展示
function changeIcon() {

    // 关闭划词翻译 checkout 勾选后，置灰所有的设置选项
    if (document.getElementById('dict_disable').checked) {
        // 指词即译
        let a = document.getElementById('ctrl_only');
        a.disabled = true;
        a.parentElement.style.color = 'grey';

        // 仅对英文翻译
        a = document.getElementById('english_only');
        a.disabled = true;
        a.parentElement.style.color = 'grey';

        // 自动发音
        a = document.getElementById('autoplay');
        a.disabled = true;
        a.parentElement.style.color = 'grey';

        // 悬浮发音
        a = document.getElementById('playwhenhovering');
        a.disabled = true;
        a.parentElement.style.color = 'grey';

        // 点击发音
        a = document.getElementById('playwhenclicking');
        a.disabled = true;
        a.parentElement.style.color = 'grey';

        // 设置带叉的图标
        chrome.browserAction.setIcon({
            path: "image/icon_no_dict.png"
        })
    } else {
        // 去掉 划词翻译 勾选后的处理
        let a = document.getElementById('ctrl_only');
        a.disabled = false;
        a.parentElement.style.color = 'black';

        a = document.getElementById('english_only');
        a.disabled = false;
        a.parentElement.style.color = 'black';

        a = document.getElementById('autoplay');
        a.disabled = false;
        a.parentElement.style.color = 'black';

        a = document.getElementById('playwhenhovering');
        a.disabled = false;
        a.parentElement.style.color = 'black';

        a = document.getElementById('playwhenclicking');
        a.disabled = false;
        a.parentElement.style.color = 'black';

        // 设置正常图标
        chrome.browserAction.setIcon({
            path: "image/icon_dict.png"
        })
    }
}

function check() {
    let word = document.getElementsByName("word")[0].value;
    window.open("http://dict.youdao.com/search?q=" + encodeURI(word) + "&ue=utf8&keyfrom=chrome.index");
}

// 如果本地储存 localStorage 中有之前的配置，则加载的时候恢复之前的配置
function restore_options() {
    // 如果 localStorage 没有存储设置，则初始化默认的设置
    if (localStorage["ColorOptions"] === undefined) {
        localStorage["ColorOptions"] = JSON.stringify(Options);
        return;
    }
    // 读取 localStorage 本地储存的 ColorOptions 对象
    let localOptions = JSON.parse(localStorage["ColorOptions"]);

    // 遍历对象中的的每个设置
    //     "dict_disable": ["checked", false],
    //     "ctrl_only": ["checked", false],
    //     "english_only": ["checked", true],
    //     "autoplay": ["checked", false],
    //     "playwhenhovering": ["checked", true],
    //     "playwhenclicking": ["checked", false]
    for (let key in localOptions) {
        // 检查原型链 Object.prototype 是否被扩展了，保证输出的都是我们自己设置的属性
        if (localOptions.hasOwnProperty(key)) {
            console.log(key);
            let optionValue = localOptions[key];
            if (!optionValue) return;
            let element = document.getElementById(key);
            if (element) {
                element.value = localOptions[key][1];
                switch (localOptions[key][0]) {
                    case "checked":
                        if (localOptions[key][1]) {
                            element.checked = true;
                        } else {
                            element.checked = false;
                        }
                        break;
                }
            }
        }
    }
}

console.log("1. 1");

document.body.onload = function () {
    console.log("2. 2");
    restore_options();
    document.getElementById('word').focus();
    changeIcon();
    document.getElementById("dict_disable").onclick = function () {
        save_options();
    };
    document.getElementById("ctrl_only").onclick = function () {
        save_options();
    };
    document.getElementById("english_only").onclick = function () {
        save_options();
    };
    document.getElementById("autoplay").onclick = function () {
        save_options();
    };
    document.getElementById("playwhenhovering").onclick = function () {
        save_options();
    };
    document.getElementById("playwhenclicking").onclick = function () {
        save_options();
    };
    document.getElementById("feedback").onclick = function () {
        goFeedback();
    };
    document.getElementById("about").onclick = function () {
        goAbout();
    };
    document.getElementById("word").onkeydown = function () {
        // 获取搜索框中的查询字符串
        let content = document.getElementById("word").value;
        // 如果回车键被按下，执行函数 manQuery
        if (event.keyCode === 13) mainQuery(content, translateXML);
    };
    document.getElementById("queryButton").onclick = function () {
        mainQuery(document.getElementsByName("word")[0].value, translateXML);
    };
};