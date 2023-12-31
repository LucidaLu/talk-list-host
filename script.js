let talk_list_header = ['id', 'type', 'date', 'time', 'room', 'presenter', 'affiliation'];

let talk_info = {}, global_data, current_selection = undefined;

let server_list = [
  // 'http://127.0.0.1:9202',
  'http://10.206.32.47:9202', 'http://82.156.12.45:9202'], server_addr;

let fetch_interval_id;

function push_data() {
  $.ajax({
    url: server_addr + '/push',
    type: 'POST',
    data: JSON.stringify(global_data),
    success: function (data) {
      console.log(data);
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
  global_data = JSON.parse(data);
  for (let i in global_data) {
    for (let j in talk_list_header) {
      let x = parseInt(i) + 1, y = parseInt(j);
      if (hot.getDataAtCell(x, y) !== global_data[i][talk_list_header[j]]) {
        hot.setDataAtCell(x, y, global_data[i][talk_list_header[j]]);
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

const hot = new Handsontable(document.querySelector('#list'), {
  data: [talk_list_header],
  minCols: talk_list_header.length,
  rowHeaders: true,
  width: $('#list-wrapper').width() / 2,
  height: window.innerHeight * 0.3,
  // colHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
  afterSelection: (row, column, row2, column2, preventScrolling, selectionLayerLevel) => {
    let i = row - 1;
    if (current_selection != i) {
      $('#profile-pic').attr("src", "");
      if (global_data && (i in global_data)) {
        current_selection = i;
        let s = `# ${global_data[i]["title"]}\n\n===\n\n`;
        s += global_data[i]["abstract"] + '\n\n===\n\n' + global_data[i]["bio"];
        cherry.setValue(s);

        $('#profile-pic').attr("src", global_data[i]["pic-prev"]);
      } else {
        current_selection = undefined;
        cherry.setValue("");
      }
    }

    push_data();

    $('#img-sec').css("visibility", "visible");
    $('#info-sec').css("visibility", "visible");
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
  }
});

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

  server_addr = server_list[0];
  $.ajax({
    url: server_addr + '/fetch',
    type: 'POST',
    success: (data) => {
      console.log('in ICT');
      load_data(data);
      scroll_to_lastest();
      fetch_interval_id = setInterval(fetch_data, 5000);
    },
    error: (data) => {
      console.log('out of ICT');
      server_addr = server_list[1];
      fetch_data(scroll_to_lastest);
      fetch_interval_id = setInterval(fetch_data, 5000);
    },
    timeout: 1000,
    data: {},
  });
}

init();

let cherry = new Cherry({
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