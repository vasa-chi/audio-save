/**
 * Created by vasa on 15.01.14.
 */

Modernizr.addTest('formdata', !!window.FormData);

var recorder, audio_context;

var startUserMedia = function (stream) {
  var input = audio_context.createMediaStreamSource(stream);
  var zeroGain = audio_context.createGain();
  zeroGain.gain.value = 0;
  input.connect(zeroGain);
  zeroGain.connect(audio_context.destination);
  recorder = new Recorder(input, {workerPath : 'scripts/recorderjs/recorderWorker.js'});
};

$(function () {
  var $start = $('#start-record'),
    $stop = $('#stop-record'),
    $save = $('#save-record'),
    $play = $('#play-record'),
    $playWrapper = $('#play-wrapper'),
    $records = $('#records');

  var start = function () {
    recorder && recorder.clear();
    recorder && recorder.record();

    $start.attr("disabled", "disabled").text('Идет запись...');
    $save.attr("disabled", "disabled");
    $stop.removeAttr("disabled");
    $playWrapper.hide();
  };

  var stop = function () {
    recorder && recorder.stop();

    $stop.attr("disabled", "disabled");
    $start.removeAttr("disabled").text('Начать запись');
    $save.removeAttr("disabled");
    $playWrapper.show();
  };

  var save = function () {
    $playWrapper.hide();
    var formData = new FormData();
    recorder.exportWAV(function (blob) {
      formData.append('record', blob);

      var request = new XMLHttpRequest();
      request.open("POST", "/records");
      request.send(formData);

      request.onreadystatechange = function () {
        if (request.readyState === 4) {
          var response = JSON.parse(request.response);
          var $li = $('<li class="bold-and-new"></li>').append($('<a></a>').attr('href', response.path).text(response.path))
          $records.prepend($li);
          $li.focus()
            .removeClass('bold-and-new')
        }
      }
    })
  };

  var play = function () {
    recorder.exportWAV(function (wav) {
      window.URL = window.URL || window.webkitURL;
      var dataURI = window.URL.createObjectURL(wav);
      var sound = soundManager.createSound({url : dataURI});
      $play.attr('disabled', 'disabled');

      sound.play({onfinish : function () {$play.removeAttr('disabled')}})
    })
  };

  $start.click(start);
  $stop.click(stop);
  $save.click(save);
  $play.click(play);

  try {
    // webkit shim
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                             navigator.mozGetUserMedia || navigator.msGetUserMedia;
    window.URL = window.URL || window.webkitURL;

    audio_context = new AudioContext;
  } catch (e) {
    alert('No web audio support in this browser!');
  }


  navigator.getUserMedia({audio : true}, startUserMedia, function (e) {
    alert('No live audio input: ' + e);
  });

  var request = new XMLHttpRequest();
  request.open("GET", "/records");
  request.send();

  request.onreadystatechange = function () {
    if (request.readyState === 4) {
      var response = JSON.parse(request.response);

      for (var i = 0; i < response.records.length; i++) {
        var record = response.records[i];
        $records.append($('<li></li>').append($('<a></a>').attr('href', record).text(record)))
      }
    }
  };

  soundManager.setup({ preferFlash : false })
});
