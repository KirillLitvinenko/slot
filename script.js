var rows = 3;
var cols = 3;
var spinDuration = 2000; //duration in ms
var stopDelay = 500; // stop delay in ms
var testMatrix = [];
var testModeOn = false;

function createTestModeView() {
  var testModeElement = $('#test-reels');
  var template = document.querySelector('#reel');
  for (var i = 0; i < cols; i++) {
    var clone = template.content.cloneNode(true);
    clone.querySelector('#reel-position-0').id = 'reel-position-' + i;
    clone.querySelector('#reel-value-0').id = 'reel-value-' + i;
    testModeElement.append(clone);
    (function(index) {
      $('#reel-position-' + index).on('change', function(event) {
        if (parseInt(event.target.value) >= 0) {
          $('#reel-value-' + index).attr('disabled', false);
        } else {
          $('#reel-value-' + index).attr('disabled', true);
        }
      })
    })(i);
  }
}

function generateTestMatrix() {
  testMatrix = [];
  for (var i = 0; i < cols; i++) {
    var rowNumber = parseInt($('#reel-position-' + i).val());
    var cellValue = parseInt($('#reel-value-' + i).val());
    testMatrix.push({row: rowNumber, cellValue: cellValue});
  }
}

function generateSpinResult() {
  var resultMatrix = [];
  for (var i = 0; i < rows; i++) {
    resultMatrix[i] = [];
    for (var j = 0; j < cols; j++) {
      resultMatrix[i][j] = Math.floor(Math.random() * 5);
    }
  }

  return resultMatrix;
}

function createView() {
  for (var i = 0; i < cols; i++) {
    var itemsInColumn = 0;
    var firstLastClass = '';
    $('#rotate').append('<div class="column" id="column-' + i + '"></div>');
    while (itemsInColumn < rows) {
      if (i === 0) {
        firstLastClass = 'firstInARow';
      } else if (i === rows - 1) {
        firstLastClass = 'lastInARow';
      }
      $('#column-' + i).append('<div class="cell" id="cell-' + itemsInColumn + i + '"></div>');
      $('#cell-' + itemsInColumn + i).addClass(firstLastClass);
      itemsInColumn++;
    }
  }
}

function spin(type) {
  var resultToView = generateSpinResult();

  if (testModeOn && testMatrix.length && type === 'result') {
    for (var k = 0; k < testMatrix.length; k++) {
      if (testMatrix[k].row >= 0) {
        resultToView[testMatrix[k].row][k] = testMatrix[k].cellValue;
      }
    }
  }

  for (var i = 0; i < resultToView.length; i++) {
    for (var j = 0; j < resultToView[i].length; j++) {
      var currentCell = $('#cell-' + i + j);
      currentCell.removeClass('win-row');
      // where 141 -- image width, 20 -- double sprite margin, 10 -- first margin in sprite
      currentCell.css('background-position-x', -((141 * resultToView[i][j]) + (20 * resultToView[i][j]) + 10))
    }
  }

  if (type === 'result') {
    changeElementsState(true);
    $('#win-sum-text').text('').addClass('blinking-text');
    $('.column').addClass('column-animated');
    addSubtractMoneyAmount(-1);
    var timeout = setTimeout(function() {
      calculateWin(resultToView, timeout)
    }, spinDuration);
  }
}

function threeInARowCheck(row) {
  return row.every(function(element) {
    return element === row[0];
  }) ? row[0] : -1;
}

function styleRowOnWin(winRow) {
  for (var i = 0; i < cols; i ++) {
    $('#cell-' + winRow + i).addClass('win-row');
  }
}

function changeMoneyAmount() {
  var moneyInputElement = $('#money-input');
  moneyInputElement.on('change', function() {
    var money = parseInt(moneyInputElement.val());
    if (money > 0) $('#start-spin').attr('disabled', false);
  });
}

function addSubtractMoneyAmount(sum) {
  var moneyInputElement = $('#money-input');
  var moneyAmount = parseInt(moneyInputElement.val());
  moneyInputElement.val((moneyAmount + sum).toString());
}

function calculateWin(resultMatrix, timeout) {
  var stakeRow = $('#stake-row').val();
  var winSum = 0;

  var threeInARow = threeInARowCheck(resultMatrix[stakeRow]);

  if (threeInARow !== -1) {
    switch (threeInARow) {
      case 0:
        winSum = 20;
        break;
      case 1:
        winSum = 50;
        break;
      case 2:
        if (stakeRow === '0') {
          winSum = 2000;
        } else if (stakeRow === '1') {
          winSum = 1000;
        } else {
          winSum = 4000;
        }
        break;
      case 3:
        winSum = 10;
        break;
      case 4:
        winSum = 150;
        break;
      default:
        winSum = 0;
        break;
    }
  } else {

    var cherryAndSeven = resultMatrix[stakeRow].every(function(element) {
      return ![0, 1, 3].includes(element)
    });

    var bars = resultMatrix[stakeRow].every(function(element) {
      return ![2,4].includes(element)
    });

    if (cherryAndSeven) {
      winSum = 75;
    } else if (bars) {
      winSum = 5;
    } else {
      winSum = 0;
    }
  }

  $('.column').each(function(index) {
    (function(that, i) {
      setTimeout(function() {
        $(that).removeClass('column-animated');
      }, stopDelay * i);
    })(this, index);
  });

  clearTimeout(timeout);

  if (winSum > 0) {
    setTimeout(function() {
      styleRowOnWin(stakeRow);
      addSubtractMoneyAmount(winSum);
      $('#win-sum-text').text(winSum).addClass('blinking-text');
      changeElementsState(false);
    }, stopDelay * cols - 1);
  }
}

function changeElementsState(state) {
  $('#start-spin').attr('disabled', state);
  $('#money-input').attr('disabled', state);
  $('#stake-row').attr('disabled', state);
  $('#test-mode').attr('disabled', state);
}

$(document).ready(function() {
  createTestModeView();

  $('#generate-test').on('click', function() {
    generateTestMatrix()
  });

  $('#test-mode').on('change', function(event) {
    var hiddenFieldElement = $('#hidden-field');
    if ($(event.target).is(':checked')) {
      hiddenFieldElement.removeClass('hide');
      testModeOn = true;
    } else {
      hiddenFieldElement.addClass('hide');
      testModeOn = false;
    }
  });

  $('#start-spin').on('click', function() {
    spin('result');
  });

  changeMoneyAmount();
  createView();
  spin();
});