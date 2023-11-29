const container = document.querySelector('#list');

let talk_list_header = ['id', 'type', 'date', 'time', 'room', 'presenter', 'affiliation'];

let talk_info = {}, global_data;

let current_selection = undefined;

let server_addr = 'http://10.206.32.47:8888';
// let server_addr = 'http://127.0.0.1:8888';

function update_abs_and_bio() {
  let s = cherry.getValue();
  let arr = s.split('===');
  console.log(arr[0]);
  global_data[current_selection]["title"] = arr[0].substring(1).trim();
  global_data[current_selection]["abstract"] = arr[1].trim();
  global_data[current_selection]["bio"] = arr[2].trim();
  console.log(global_data[current_selection]);
}

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

let activated = false;

function fetch_data() {
  activated = false;
  $.ajax({
    url: server_addr + '/fetch',
    type: 'POST',
    success: function (data) {
      let initial = global_data === undefined;
      global_data = JSON.parse(data);

      for (let i in global_data) {
        for (let j in talk_list_header) {
          let x = parseInt(i) + 1, y = parseInt(j);
          if (hot.getDataAtCell(x, y) !== global_data[i][talk_list_header[j]]) {
            hot.setDataAtCell(x, y, global_data[i][talk_list_header[j]]);
          }
        }
      }
      if (initial) {
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
      activated = true;
      // let last = parseInt(global_data[global_data.length - 1]['id']);
      // for (let i = 0; i < 20; ++i) {
      //   hot.setDataAtCell(i + global_data.length, 0, (last + i).toString());
      // }
    },
    error: function (data) {
      alert('网络错误，请联系路已人');
      clearInterval();
    },
    data: {},
  });
}

// setInterval(fetch_data, 500);


const hot = new Handsontable(container, {
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

        $('#profile-pic').attr("src", global_data[i]["pic"]);
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
    if (activated) {
      changes?.forEach(([row, col, oldValue, newValue]) => {
        // Some logic...
        global_data[row - 1][talk_list_header[col]] = newValue;
      });
      console.log(global_data);
      push_data();
    }
  }
});

// setInterval(() => { let x = Math.round(Math.random() * 20); hot.setDataAtCell(x, 0, Math.random()); }, 1000)
fetch_data();

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
      $('#profile-pic').attr("src", data);
      if (current_selection !== undefined) {
        global_data[current_selection]["pic"] = data;
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
      data: { type: type, id: global_data[current_selection]['id'] },
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

function download_poster() {
  if (current_selection !== undefined) {
    $.ajax({
      url: server_addr + '/poster-ready',
      type: 'POST',
      data: { id: global_data[current_selection]['id'] },
      success: function (data) {
        if (data === "ready") {
          window.location.href = server_addr + `/download-poster?id=${global_data[current_selection]['id']}`;
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