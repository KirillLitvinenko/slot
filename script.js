const ROWS = 3;
const COLS = 3;
const SPIN_DURATION = 2000; //duration in ms
const STOP_DELAY = 500; // stop delay in ms
let testMatrix = [];
let testModeBlockShow = false;

function createTestModeView() {
  let testModeElement = $('#test-reels');
  let template = $('#reel').html();
  let generatedHtml = '';

  for (let i = 0; i < COLS; i++) {
    let clone = $(template);
    clone.find('#reel-position').attr('id', 'reel-position-' + i);
    clone.find('#reel-value').attr('id', 'reel-value-' + i);
    generatedHtml = generatedHtml + clone.get(0).outerHTML;
  }
  testModeElement.append(generatedHtml);
  $('.select-position').change(function() {
    $(this).parent().find('.select-value').attr('disabled', parseInt($(this).val()) < 0)
  });
}

function generateTestMatrix() {
  testMatrix = [];
  let rowNumber, cellValue;

  for (let i = 0; i < COLS; i++) {
    rowNumber = parseInt($('#reel-position-' + i).val());
    cellValue = parseInt($('#reel-value-' + i).val());
    testMatrix.push({row: rowNumber, cellValue: cellValue});
  }
}

function generateSpinResult() {
  let resultMatrix = [];
  for (let i = 0; i < ROWS; i++) {
    resultMatrix[i] = [];
    for (let j = 0; j < COLS; j++) {
      resultMatrix[i][j] = Math.floor(Math.random() * 5);
    }
  }

  return resultMatrix;
}

function createView() {
  for (let i = 0; i < COLS; i++) {
    let itemsInColumn = 0;
    let firstLastClass = '';

    $('#rotate').append('<div class="column" id="column-' + i + '"></div>');
    while (itemsInColumn < ROWS) {
      if (i === 0) {
        firstLastClass = 'firstInARow';
      } else if (i === ROWS - 1) {
        firstLastClass = 'lastInARow';
      }
      $('#column-' + i).append('<div class="cell" id="cell-' + itemsInColumn + i + '"></div>');
      $('#cell-' + itemsInColumn + i).addClass(firstLastClass);
      itemsInColumn++;
    }
  }
}

function spin(type) {
  let resultToView = generateSpinResult();

  // change random results with test values if any
  if (testModeBlockShow && testMatrix.length && type === 'result') {
    for (let i = 0; i < testMatrix.length; i++) {
      if (testMatrix[i].row >= 0) {
        resultToView[testMatrix[i].row][i] = testMatrix[i].cellValue;
      }
    }
  }

  for (let i = 0; i < resultToView.length; i++) {
    for (let j = 0; j < resultToView[i].length; j++) {
      let currentCell = $('#cell-' + i + j);
      currentCell.removeClass('win-row');
      // where 141 -- image width, 20 -- double sprite margin, 10 -- first margin in sprite
      currentCell.css('background-position-x', -((141 * resultToView[i][j]) + (20 * resultToView[i][j]) + 10))
    }
  }

  if (type === 'result') {
    setDisabledStateOnInputs(true);
    $('.column').addClass('column-animated');
    addSubtractMoneyAmount(-1);
    $('#win-sum-text').text('').removeClass('blinking-text');
    let timeout = setTimeout(function() {
      endSpin(resultToView, timeout)
    }, SPIN_DURATION);
  }
}

function threeInARowCheck(row) {
  return row.every(function(element) {
    return element === row[0];
  }) ? row[0] : -1;
}

function styleRowOnWin(winRow) {
  for (let i = 0; i < COLS; i ++) {
    $('#cell-' + winRow + i).addClass('win-row');
  }
}

function changeMoneyAmount() {
  let moneyInputElement = $('#money-input');
  let money = 0;
  moneyInputElement.change(function() {
    money = parseInt(moneyInputElement.val());
    $('#start-spin').attr('disabled', money < 0);
  });
}

function addSubtractMoneyAmount(sum) {
  let moneyInputElement = $('#money-input');
  let moneyAmount = parseInt(moneyInputElement.val());
  moneyInputElement.val((moneyAmount + sum).toString());
}

function calculateWin(resultMatrix) {
  let stakeRow = $('#stake-row').val();
  let winSum = 0;
  let threeInARow = threeInARowCheck(resultMatrix[stakeRow]);

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

    let cherryAndSeven = resultMatrix[stakeRow].every(function(element) {
      return ![0, 1, 3].includes(element); // only cherry and 7 in row
    });

    let bars = resultMatrix[stakeRow].every(function(element) {
      return ![2,4].includes(element); // only bars in row
    });

    if (cherryAndSeven) {
      winSum = 75;
    } else if (bars) {
      winSum = 5;
    } else {
      winSum = 0;
    }
  }
  return winSum;
}

function endSpin(resultMatrix, timeout) {
  let stakeRow = $('#stake-row').val();
  let winSum = calculateWin(resultMatrix);

  $('.column').each(function(index) {
    (function(that, i) {
      setTimeout(function() {
        $(that).removeClass('column-animated');
      }, STOP_DELAY * i);
    })(this, index);
  });

  setTimeout(function() {
    if (winSum > 0) {
      styleRowOnWin(stakeRow);
      addSubtractMoneyAmount(winSum);
      $('#win-sum-text').text(winSum).addClass('blinking-text');
    }
    setDisabledStateOnInputs(false);
    clearTimeout(timeout);
  }, STOP_DELAY * COLS - 1);
}

function setDisabledStateOnInputs(state) {
  $('#start-spin').attr('disabled', state);
  $('#money-input').attr('disabled', state);
  $('#stake-row').attr('disabled', state);
  $('#test-mode').attr('disabled', state);
}

$(document).ready(function() {
  createTestModeView();

  $('#generate-test').click(function() {
    generateTestMatrix();
    $('#test-mode-sign').removeClass('hide');
  });

  $('#test-mode').change(function(event) {
    let hiddenFieldElement = $('#hidden-field');
    let testModeSign = $('#test-mode-sign');
    if ($(event.target).is(':checked')) {
      hiddenFieldElement.removeClass('hide');
      testModeBlockShow = true;
      testMatrix.length && testModeSign.removeClass('hide');
    } else {
      hiddenFieldElement.addClass('hide');
      testModeBlockShow = false;
      testModeSign.addClass('hide');
    }
  });

  $('#start-spin').click(function() {spin('result')});

  changeMoneyAmount();
  createView();
  spin();
});