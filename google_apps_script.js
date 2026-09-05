/**
 * VisionEduLink Lab 수강 신청 구글 시트 연동 스크립트
 * 
 * 구글 스프레드시트 URL: 
 * https://docs.google.com/spreadsheets/d/1xG7XdDSGzvyRDLcYGRx2DJC2NVgUbidgjp7mpP4t-No/edit
 */

const SPREADSHEET_ID = '1xG7XdDSGzvyRDLcYGRx2DJC2NVgUbidgjp7mpP4t-No';

function doPost(e) {
  var lock = LockService.getScriptLock();
  // 동시 제출 충돌 방지 (최대 10초 대기)
  lock.tryLock(10000);

  try {
    var ss;
    if (SPREADSHEET_ID && SPREADSHEET_ID !== 'YOUR_SPREADSHEET_ID') {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    var sheet = ss.getActiveSheet() || ss.getSheets()[0];

    // 첫 행(헤더)이 없으면 자동으로 타이틀 행 생성 및 스타일 적용
    if (sheet.getLastRow() === 0) {
      var headerRange = sheet.getRange(1, 1, 1, 6);
      headerRange.setValues([['신청일시', '이름', '연락처', '이메일', '관심분야', '하고 싶은 말']]);
      headerRange.setBackground('#2d4739');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      sheet.setRowHeight(1, 36);
    }

    // 전송된 데이터 파싱 (JSON 또는 폼 파라미터)
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var now = new Date();
    var timestamp = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    var name = data.name || '';
    var phone = data.phone || '';
    var email = data.email || '';
    var interest = data.interest || '';
    var message = data.message || '';

    // 시트에 새 행 추가
    sheet.appendRow([timestamp, name, phone, email, interest, message]);

    return ContentService.createTextOutput(
      JSON.stringify({ result: 'success', row: sheet.getLastRow() })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: 'error', error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// GET 요청 테스트용 (배포 후 웹 앱 URL로 브라우저 접속 시 작동 확인)
function doGet(e) {
  return ContentService.createTextOutput('VisionEduLink Lab 수강 신청 API가 정상 작동 중입니다. (POST 요청 대기)').setMimeType(ContentService.MimeType.TEXT);
}
