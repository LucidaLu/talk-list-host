let talk_list_header = ['id', 'type', 'date', 'time', 'room', 'presenter', 'affiliation', 'wechat-link'];

let talk_info = {}, all_data, global_data, reports_data, prd_data, current_selection = undefined;

let server_list = [
  // 'http://127.0.0.1:9202',
  'https://10.206.32.47:9202', 'https://82.156.12.45:9210'], server_addr;

let fetch_interval_id;

let is_mail_page = document.getElementById('markdown-container') === null;
function push_data() {
  $.ajax({
    url: server_addr + '/push',
    type: 'POST',
    data: JSON.stringify(all_data),
    success: function (data) {
      console.log(data);
      fetch_data();
    },
    error: function (data) {
      console.log(data);
    }
  });
}

function update_abs_and_bio() {
  let s = cherry.getValue();
  let arr = s.split('===');
  console.log(arr[0]);
  global_data[current_selection]["title"] = arr[0].substring(1).trim();
  global_data[current_selection]["abstract"] = arr[1].trim();
  global_data[current_selection]["bio"] = arr[2].trim();
  console.log(global_data[current_selection]);
  push_data();
}

let mon_tab_changes = false;

function load_data(data) {
  mon_tab_changes = false;
  all_data = JSON.parse(data);
  global_data = all_data["talks"];
  for (let i in global_data) {
    for (let j in talk_list_header) {
      let x = parseInt(i) + 1, y = parseInt(j);
      if (hot.getDataAtCell(x, y) !== global_data[i][talk_list_header[j]]) {
        hot.setDataAtCell(x, y, global_data[i][talk_list_header[j]]);
      }
    }
  }

  if (is_mail_page) {
    reports_data = all_data["reports"];
    for (let i in reports_data) {
      for (let j in reports_header) {
        let x = parseInt(i) + 1, y = parseInt(j);
        if (hot_rep.getDataAtCell(x, y) !== reports_data[i][reports_header[j]]) {
          hot_rep.setDataAtCell(x, y, reports_data[i][reports_header[j]]);
        }
      }
    }

    prd_data = all_data["pread"];
    for (let i in prd_data) {
      for (let j in prd_header) {
        let x = parseInt(i) + 1, y = parseInt(j);
        if (hot_prd.getDataAtCell(x, y) !== prd_data[i][prd_header[j]]) {
          hot_prd.setDataAtCell(x, y, prd_data[i][prd_header[j]]);
        }
      }
    }
  }

  mon_tab_changes = true;
}

function fetch_data(callback) {
  $.ajax({
    url: server_addr + '/fetch',
    type: 'POST',
    success: (data) => {
      load_data(data);
      if (callback) callback();
    },
    error: (request, status, error) => {
      console.log(error);
      alert('网络错误，请联系路已人');
      clearInterval(fetch_interval_id);
    },
    data: {},
  });
}

let active_speaker = [], active_report = [], active_prd = [];

const hot = new Handsontable(document.querySelector('#list'), {
  data: [talk_list_header],
  minCols: talk_list_header.length,
  rowHeaders: true,
  colWidths: [50, 50, 100, 50, 50, 100, 200, 100],
  width: $('#list-wrapper').width() / 2,
  height: window.innerHeight * (is_mail_page ? 0.4 : 0.3),
  // colHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
  afterSelection: (row, column, row2, column2, preventScrolling, selectionLayerLevel) => {
    // console.log(hot.getSelected());
    let i = row - 1;
    if (current_selection != i) {
      $('#profile-pic').attr("src", "");
      if (global_data && (i in global_data)) {
        current_selection = i;
        let s = `# ${global_data[i]["title"]}\n\n===\n\n`;
        s += global_data[i]["abstract"] + '\n\n===\n\n' + global_data[i]["bio"];
        if (cherry)
          cherry.setValue(s);

        $('#profile-pic').attr("src", global_data[i]["pic-prev"]);
      } else {
        current_selection = undefined;
        if (cherry)
          cherry.setValue("");
      }
    }



    push_data();

    $('#img-sec').css("visibility", "visible");
    $('#info-sec').css("visibility", "visible");

    if (is_mail_page) {
      let s = "", rows = [];
      for (i of hot.getSelected()) {
        for (let j = Math.min(i[0], i[2]); j <= Math.max(i[0], i[2]); j++) rows.push(j);
      }
      rows.sort((a, b) => a - b);
      for (let i of rows) {
        if (s.length > 0) s += ", ";
        s += global_data[i - 1]['presenter'] + `（${global_data[i - 1]['date']}）`;
      }

      active_speaker = rows;
      $("#speaker-show").html(s);
    }
  },
  afterChange: (changes) => {
    if (mon_tab_changes) {
      changes?.forEach(([row, col, oldValue, newValue]) => {
        // Some logic...
        global_data[row - 1][talk_list_header[col]] = newValue;
      });
      console.log(global_data);
      push_data();
    }
  },
  // renderer: function (instance, td, row, col, prop, value, cellProperties) {
  //   Handsontable.renderers.TextRenderer.apply(this, arguments);
  //   td.innerHTML = `<div class="truncated">${value}</div>`
  // }
});

let hot_rep = undefined, hot_prd = undefined;
let reports_header = ['date', 'time', 'room', 'student'], prd_header = ['date', 'time', 'room', 'student', 'doi', 'attachment'];
if (is_mail_page) {
  hot_rep = new Handsontable(document.querySelector('#reports'), {
    data: [reports_header],
    minCols: 5,
    rowHeaders: true,

    width: $('#list-wrapper').width() / 2,
    height: window.innerHeight * 0.4,
    // colHeaders: true,
    licenseKey: 'non-commercial-and-evaluation',
    afterSelection: (row, column, row2, column2, preventScrolling, selectionLayerLevel) => {
      let s = "", rows = [];
      for (i of hot_rep.getSelected()) {
        for (let j = Math.min(i[0], i[2]); j <= Math.max(i[0], i[2]); j++) rows.push(j);
      }
      rows.sort((a, b) => a - b);
      for (let i of rows) {
        if (s.length > 0) s += ", ";
        s += reports_data[i - 1]['student'] + `（${reports_data[i - 1]['date']}）`;
      }
      active_report = rows;
      $("#report-show").html(s);
    },
    afterChange: (changes) => {
      if (mon_tab_changes) {
        changes?.forEach(([row, col, oldValue, newValue]) => {
          // Some logic...
          reports_data[row - 1][reports_header[col]] = newValue;
        });
        console.log(reports_data);
        push_data();
      }
    },
    // renderer: function (instance, td, row, col, prop, value, cellProperties) {
    //   Handsontable.renderers.TextRenderer.apply(this, arguments);
    //   td.innerHTML = `<div class="truncated">${value}</div>`
    // }
  });

  hot_prd = new Handsontable(document.querySelector('#prd'), {
    data: [prd_header],
    minCols: 5,
    rowHeaders: true,
    width: $('#list-wrapper').width() / 2,
    colWidths: [100, 50, 50, 100, 200, 200],
    height: window.innerHeight * 0.45,
    // colHeaders: true,
    licenseKey: 'non-commercial-and-evaluation',
    afterSelection: (row, column, row2, column2, preventScrolling, selectionLayerLevel) => {
      let s = "", rows = [];
      for (i of hot_prd.getSelected()) {
        for (let j = Math.min(i[0], i[2]); j <= Math.max(i[0], i[2]); j++) rows.push(j);
      }
      rows.sort((a, b) => a - b);
      for (let i of rows) {
        if (s.length > 0) s += ", ";
        s += prd_data[i - 1]['student'] + `（${prd_data[i - 1]['date']}）`;
      }
      active_prd = rows;
      $("#reading-show").html(s);
    },
    afterChange: (changes) => {
      if (mon_tab_changes) {
        changes?.forEach(([row, col, oldValue, newValue]) => {
          // Some logic...
          prd_data[row - 1][prd_header[col]] = newValue;
        });
        console.log(prd_data);
        push_data();
      }
    },
    // renderer: function (instance, td, row, col, prop, value, cellProperties) {
    //   Handsontable.renderers.TextRenderer.apply(this, arguments);
    //   td.innerHTML = `<div class="truncated">${value}</div>`
    // }
  });
}

function init() {
  function scroll_to_lastest() {
    let next = -1;
    for (let i in global_data) {
      if (Date.parse(global_data[i]["date"]) > Date.now()) {
        next = parseInt(i) + 1;
        break;
      }
    }
    if (next !== -1) {
      hot.scrollViewportTo(Math.max(0, next - 4), 0);
    }
  }

  server_addr = server_list[1];
  fetch_data(scroll_to_lastest);
  // $.ajax({
  //   url: server_addr + '/fetch',
  //   type: 'POST',
  //   success: (data) => {
  //     console.log('in ICT');
  //     load_data(data);
  //     scroll_to_lastest();
  //     // fetch_interval_id = setInterval(fetch_data, 5000);
  //   },
  //   error: (data) => {
  //     console.log('out of ICT');
  //     server_addr = server_list[1];
  //     fetch_data(scroll_to_lastest);
  //     // fetch_interval_id = setInterval(fetch_data, 5000);
  //   },
  //   timeout: 1000,
  //   data: {},
  // });
}

init();
let cherry = undefined;
// check if there is #markdown-container
if (is_mail_page) {
  console.log('No #markdown-container found');
} else {
  cherry = new Cherry({
    id: 'markdown-container',
    externals: {
      katex: window.katex,
      MathJax: window.MathJax,
    },
    isPreviewOnly: false,
    engine: {
      global: {
        urlProcessor(url, srcType) {
          console.log(`url-processor`, url, srcType);
          return url;
        },
      },
      syntax: {
        codeBlock: {
          theme: 'twilight',
        },
        table: {
          enableChart: false,
          // chartEngine: Engine Class
        },
        fontEmphasis: {
          allowWhitespace: false, // 是否允许首尾空格
        },
        strikethrough: {
          needWhitespace: false, // 是否必须有前后空格
        },
        mathBlock: {
          engine: 'MathJax', // katex或MathJax
          src: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js', // 如果使用MathJax plugins，则需要使用该url通过script标签引入
        },
        inlineMath: {
          engine: 'MathJax', // katex或MathJax
        },
        emoji: {
          useUnicode: false,
          customResourceURL: 'https://github.githubassets.com/images/icons/emoji/unicode/${code}.png?v8',
          upperCase: true,
        },
      },
    },
    toolbars: {
      showToolbar: false,
      toolbar: false,
      bubble: false,
      float: false,
    },
    editor: {
      defaultModel: 'edit&preview',
    },
    previewer: {
      // 自定义markdown预览区域class
      // className: 'markdown'
    },
    keydown: [],
    //extensions: [],
    editor: {
      id: 'cherry-text',
      name: 'cherry-text',
      autoSave2Textarea: true,
    },
    callback: {
      afterChange: update_abs_and_bio,
    }
  });
}

$('#file').change(function () {
  var f = this.files[0];
  var formData = new FormData();
  formData.append('file', f);
  console.log(formData);
  $('#profile-pic').attr("src", "");
  document.getElementById("file").disabled = true;

  $.ajax({
    url: server_addr + '/upload',
    type: 'POST',
    success: function (data) {
      data = JSON.parse(data);
      $('#profile-pic').attr("src", data["prev_url"]);
      if (current_selection !== undefined) {
        global_data[current_selection]["pic"] = data["url"];
        global_data[current_selection]["pic-prev"] = data["prev_url"];
        push_data();
      }
      $('#file').val('');
      document.getElementById("file").disabled = false;
    },
    error: function (data) {
      console.log(data);
    },
    data: formData,
    cache: false,
    contentType: false,
    processData: false
  });
});


function start_generate(type) {
  if (current_selection !== undefined) {
    $.ajax({
      url: server_addr + '/start-generate',
      type: 'POST',
      data: {
        type: type,
        id: global_data[current_selection]['id'],
        tit_fs: $('#tit-fs').val(),
        txt_fs: $('#txt-fs').val(),
        bio_mode: $('input[name="inlineRadioOptions"]:checked').val()
      },
      success: function (data) {
        if (data === "started") {
          alert("generating started");
        } else {
          alert("already generating");
        }
      },
      error: function (data) {
        console.log(data);
      },
    });
  }
}


function get_stat(type) {
  if (current_selection !== undefined) {
    $.ajax({
      url: server_addr + '/get-stat',
      type: 'POST',
      data: { type: type, id: global_data[current_selection]['id'] },
      success: function (data) {
        alert(`generation status:\n\n${data}`);
      },
      error: function (data) {
        console.log(data);
      },
    });
  }
}

function download(type) {
  if (current_selection !== undefined) {
    $.ajax({
      url: server_addr + `/ready`,
      type: 'POST',
      data: { id: global_data[current_selection]['id'], type: type },
      success: function (data) {
        if (data === "ready") {
          window.open(server_addr + `/download-${type}?id=${global_data[current_selection]['id']}`);
        } else {
          alert('not ready yet');
        }
      },
      error: function (data) {
        alert('not ready yet');
      },
    });
  }
}

function month_day(date_string) {
  let dao = new Date(date_string);
  return `${dao.getMonth() + 1}月${dao.getDate()}日`;
}

function generate_mail() {
  console.log(active_speaker, active_report, active_prd);
  let s = "";
  function fmt_date(ds, len = 1) {
    let date_obj = new Date(ds);
    // 3月4日（本周四） 10:00-11:00
    return `${date_obj.getMonth() + 1}月${date_obj.getDate()}日（${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date_obj.getDay()]}） ${date_obj.getHours().toString().padStart(2, '0')}:${date_obj.getMinutes().toString().padStart(2, '0')}~${(date_obj.getHours() + len).toString().padStart(2, '0')}:${date_obj.getMinutes().toString().padStart(2, '0')}`;
  }

  function remove_outdiv(s) {
    const newDiv = document.createElement("div");
    newDiv.innerHTML = s;
    s = newDiv.children[0].children[0].innerHTML;
    newDiv.remove();
    return s;
  }

  const P_STYLE = `style="font-family: Arial; text-align: left; text-indent: 0px; line-height: 1.5; margin-top: 0px; margin-bottom: 0px; font-size: 12pt"`;


  s += `<p ${P_STYLE}>大家好！</p>
<p ${P_STYLE}>下面是本周活动安排：</p>
<p>&nbsp;</p>`;
  let notes = [];
  if (document.getElementById('reading-check').checked) {
    if (active_prd.length == 0) {
      alert('请至少选择一个paper reading，如果这周没有，也选一个，然后把勾去掉，因为要根据当前的时间计算后面五周的预告');
    }
    for (let i of active_prd) {
      let data = prd_data[i - 1];
      let cite_obj = new Cite(data['doi']);

      let sym = ''.padStart(notes.length + 1, '*');
      let no = notes.length + 1;
      notes.push(`<p ${P_STYLE} id="footnote-${no}"><sup>${sym}</sup> ${remove_outdiv(cite_obj.format('bibliography', {
        format: 'html',
        template: 'apa',
        lang: 'en-US'
      }))}</p>`);

      s += `<p ${P_STYLE}><strong>内　容：paper reading</strong>（${data['student']}）</p>
<p ${P_STYLE}><strong>论　文：</strong>${cite_obj.get()[0]['title']}<sup>${sym}</sup>（见附件）</p>
<p ${P_STYLE}><strong>时　间：</strong>${fmt_date(`${data['date']} ${data['time']}`)}</p>
<p ${P_STYLE}><strong>地　点：</strong>会议室${data['room']} + 腾讯会议<a href="https://meeting.tencent.com/dm/vgWvFfibhmRA">612-2691-6328</a></p>

<p>&nbsp;</p>
`
    }
  }
  if (document.getElementById('speaker-check').checked) {
    for (let i of active_speaker) {
      let data = global_data[i - 1];

      s += `<p ${P_STYLE}><strong>内　容：QuACT讲座</strong></p>
<p ${P_STYLE}><strong>题　目：</strong><a href="${data['wechat-link']}">${data['title']}</a></p>
<p ${P_STYLE}><strong>讲　者：</strong>${data['presenter']}，${data['affiliation']}</p>
<p ${P_STYLE}><strong>时　间：</strong>${fmt_date(`${data['date']} ${data['time']}`)}</p>
<p ${P_STYLE}><strong>地　点：</strong>会议室${data['room']} + 腾讯会议<a href="https://meeting.tencent.com/dm/n6CjOLd30Mjl">605-5793-9921</a></p>

<p>&nbsp;</p>
`;
    }
  }

  if (document.getElementById('report-check').checked) {
    if (active_report.length == 0) {
      alert('请至少选择一个组会报告，如果这周没有，也选一个，然后把勾去掉，因为要根据当前的时间计算后面五周的预告');
      return;
    }
    for (let i of active_report) {
      let data = reports_data[i - 1];
      s += `<p ${P_STYLE}><strong>内　容：组会</strong>（${data['student']}半小时报告 + 每人5分钟报告）</p>
<p ${P_STYLE}><strong>时　间：</strong>${fmt_date(`${data['date']} ${data['time']}`, 2)}</p>
<p ${P_STYLE}><strong>地　点：</strong>会议室${data['room']} + 腾讯会议<a href="https://meeting.tencent.com/dm/NHZnA7sCte1P">722-5788-8455</a></p>

<p>&nbsp;</p>
`;
    }
  }


  let nxt_report = active_report[0] + 1;
  let nxt_prd = active_prd[0] + 1;


  const TD_STYLE = `style="padding: .5em 1em;border-left: 1px solid #cbcbcb;border-width: 0 0 1px 0;font-size: inherit;margin: 0;overflow: visible;background-color: transparent;border-bottom: 1px solid #cbcbcb; font-family:Arial; font-size: 12pt; text-align:center"`;
  const TH_STYLE = `style="padding: .5em 1em;border-left: 1px solid #cbcbcb;border-width: 0 0 1px 0;font-size: inherit;margin: 0;overflow: visible;border-bottom: 1px solid #cbcbcb; font-family:Arial; font-size: 12pt; text-align:center"`;

  let table = '';
  for (let i = 0; i < 5; ++i) {
    table += `<tr><td ${TD_STYLE}>${month_day(prd_data[nxt_prd - 1 + i]['date'])}</td><td ${TD_STYLE}>${reports_data[nxt_report - 1 + i]['student']}</td><td ${TD_STYLE}>${prd_data[nxt_prd - 1 + i]['student']}</td></tr>`;
  }

  s += `<p ${P_STYLE}><strong style="line-height: 2">接下来几周组会及paper reading安排暂定如下：</strong></p>`;
  s += `<table style="border-collapse: collapse;border-spacing: 0;empty-cells: show;border: 1px solid #cbcbcb;"><thead style="background-color: #e0e0e0;color: #000;text-align: left;vertical-align: bottom;"><tr><th ${TH_STYLE}>时间</th><th ${TH_STYLE}>半小时报告</th><th ${TH_STYLE}>paper reading</td></tr></thead><tbody>${table}</tbody></table>`;
  s += `<p>&nbsp;</p>`;

  s += `<p ${P_STYLE}>另外，<span style="color:red">请大家及时将周报提交给对应老师，并在本周周报进行更新。</span></p>`;

  s += `<p>&nbsp;</p>`;

  s += "<hr/>"

  var re = /((?:href|src)=")?(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

  s += notes.join('\n').replace(re, function (match, attr) {
    if (typeof attr != 'undefined') {
      return match;
    }
    return '<a target="_blank" href="' + match + '">' + match + '</a>';
  });

  return s;
}

async function preview_mail() {
  let s = generate_mail();
  var win = window.open("", "预览", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=800,height=600,top=100, left=100");// + (screen.height - 400) + ",left=" + (screen.width - 840));
  win.document.body.innerHTML = s;
}


function send_mail(type) {
  // let API_USER = 'sc_fffcia_test_6vlaNc';
  // let API_KEY = '55630b50b3e6b0ac0e2ed95e522543ad';
  // $.ajax({
  //   url: "http://api.sendcloud.net/apiv2/mail/send",
  //   type: 'POST',
  //   success: (e) => {
  //     console.log(e);
  //   },
  //   data: {
  //     "apiUser": API_USER,
  //     "apiKey": API_KEY,
  //     "to": "luyiren12@gmail.com",
  //     "from": "sendcloud@sendcloud.org",
  //     "fromName": "SendCloud",
  //     "subject": "【paper reading+QuACT+组会+周报】本周安排",
  //     "html": generate_mail(),
  //   },
  // });
  // console.log(s);
  let yes = true;
  if (type == 1) {
    let i = 0;
    while (i < 5) {
      let s = "";
      for (let j = 0; j < i; ++j) {
        s += "真的";
      }

      yes = confirm(s + "确认群发邮件？");
      if (yes) {
        i += 1;
      } else {
        break;
      }
    }
  }

  if (yes)
    $.ajax({
      url: server_addr + '/send-mail',
      type: 'POST',
      data: {
        type: type,
        content: generate_mail(),
        attachment: JSON.stringify([prd_data[active_prd[0] - 1]['attachment']])
      },
      success: function (data) {
        console.log(data);
      },
      error: function (data) {
        console.log(data);
      },
    });
}




function download_attach() {
  let active = active_prd[0];
  if (active !== undefined) {
    window.open(server_addr + `/download-attach?name=${prd_data[active - 1]['attachment']}`);
  }
}

$('#attach-file').change(function () {
  var f = this.files[0];
  var formData = new FormData();
  let cite_obj = new Cite(prd_data[active_prd[0] - 1]['doi']);
  let datestr = prd_data[active_prd[0] - 1]['date'].slice(5);
  let newf = new File([f], `【${datestr} ${prd_data[active_prd[0] - 1]['student']}】${cite_obj.get()[0].title}.pdf`, { type: f.type });
  formData.append('file', newf);
  console.log(formData);
  document.getElementById("attach-file").disabled = true;

  $.ajax({
    url: server_addr + '/upload-attach',
    type: 'POST',
    success: function (data) {
      console.log(data);
      let act = active_prd[0];
      hot_prd.setDataAtCell(act, 5, newf.name);
      push_data();
      document.getElementById("attach-file").disabled = false;
    },
    error: function (data) {
      console.log(data);
    },
    data: formData,
    cache: false,
    contentType: false,
    processData: false
  });
});

const mail_list_header = ["mail", "alias"];
const rec_mail = new Handsontable(document.querySelector('#rec-mails'), {
  data: [mail_list_header],
  minCols: mail_list_header.length,
  rowHeaders: true,
  colWidths: [300, 100],
  width: $('#rec-mails-wrapper').width(),
  height: window.innerHeight * 0.5,
  // colHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const cc_mail = new Handsontable(document.querySelector('#cc-mails'), {
  data: [mail_list_header],
  minCols: mail_list_header.length,
  rowHeaders: true,
  colWidths: [300, 100],
  width: $('#cc-mails-wrapper').width(),
  height: window.innerHeight * 0.5,
  licenseKey: 'non-commercial-and-evaluation',
});

$('#mailingModal').on('show.bs.modal', function (event) {
  $.ajax({
    url: server_addr + '/get-mail',
    type: 'POST',
    success: function (data) {
      let mail_data = JSON.parse(data);
      console.log(mail_data);

      for (let i in mail_data['rec']) {
        for (let j in mail_data['rec'][i]) {
          rec_mail.setDataAtCell(parseInt(i) + 1, parseInt(j), mail_data['rec'][i][j]);
        }
      }

      for (let i in mail_data['cc']) {
        for (let j in mail_data['cc'][i]) {
          cc_mail.setDataAtCell(parseInt(i) + 1, parseInt(j), mail_data['cc'][i][j]);
        }
      }
    },
    error: function (data) {
      console.log(data);
    },
  });

})

function save_mailst() {
  console.log(321);
  let mail_data = {
    rec: [],
    cc: [],
  };
  for (let i = 1; i < rec_mail.countRows(); ++i) {
    mail_data['rec'].push([rec_mail.getDataAtCell(i, 0), rec_mail.getDataAtCell(i, 1)]);
  }
  for (let i = 1; i < cc_mail.countRows(); ++i) {
    mail_data['cc'].push([cc_mail.getDataAtCell(i, 0), cc_mail.getDataAtCell(i, 1)]);
  }
  console.log(mail_data);

  $.ajax({
    url: server_addr + '/push-mail',
    type: 'POST',
    data: { mailst: JSON.stringify(mail_data) },
    success: function (data) {
      console.log(data);
    },
    error: function (data) {
      console.log(data);
    }
  });
}