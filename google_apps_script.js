/**
 * VisionEduLink Lab 수강 신청 구글 시트 연동 스크립트
 *
 * 구글 스프레드시트 URL:
 * https://docs.google.com/spreadsheets/d/1xG7XdDSGzvyRDLcYGRx2DJC2NVgUbidgjp7mpP4t-No/edit
 */

const SPREADSHEET_ID = '1xG7XdDSGzvyRDLcYGRx2DJC2NVgUbidgjp7mpP4t-No';

// 카카오 알림톡(나에게 보내기)용 앱 정보
const KAKAO_CLIENT_ID = 'dbf364842925c13b9e4fe150b87729ed';
const KAKAO_CLIENT_SECRET = 'JNS5OfZFNc92bpXV5pYVPlZyo4tnt1Rk';

// 기관 협력 문의가 들어왔을 때 이메일을 받을 주소 (필요하면 바꿔주세요)
const INQUIRY_NOTIFY_EMAIL = 'fairy305@hanmail.net';

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

    // formType이 'institute'면 기관 협력 문의, 없으면 일반 수강신청으로 처리
    if (data.formType === 'institute') {
      return handleInstituteInquiry(ss, data);
    }
    return handleApplyForm(ss, data);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: 'error', error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * 일반 수강신청 폼 처리 (기존 로직)
 */
function handleApplyForm(ss, data) {
  // 항상 첫 번째 시트(스프레드시트 탭)를 사용합니다.
  // (getActiveSheet()는 "기관협력문의" 시트가 새로 생기면서 활성 시트가 바뀔 수 있어
  //  더 이상 사용하지 않고, 항상 첫 번째 탭을 고정으로 가리키도록 했습니다.)
  var sheet = ss.getSheets()[0];

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

  var now = new Date();
  var timestamp = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  var name = data.name || '';
  var phone = data.phone || '';
  var email = data.email || '';
  var interest = data.interest || '';
  var message = data.message || '';

  // 시트에 새 행 추가
  sheet.appendRow([timestamp, name, phone, email, interest, message]);

  // 새 수강신청이 들어오면 카카오톡으로 나에게 알림 보내기
  try {
    var kakaoMessage =
      '📋 새로운 수강신청이 접수되었습니다!\n\n' +
      '이름: ' + (name || '(없음)') + '\n' +
      '연락처: ' + (phone || '(없음)') + '\n' +
      '이메일: ' + (email || '(없음)') + '\n' +
      '관심분야: ' + (interest || '(없음)') + '\n' +
      '신청시각: ' + timestamp;
    sendKakaoNotification(kakaoMessage);
  } catch (kakaoErr) {
    Logger.log('카카오 알림 전송 실패(시트 저장은 정상 완료됨): ' + kakaoErr);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ result: 'success', row: sheet.getLastRow() })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 기관 협력 문의 폼 처리
 * - "기관협력문의"라는 별도 시트 탭에 기록
 * - 접수 즉시 이메일로 알림 발송 (INQUIRY_NOTIFY_EMAIL)
 */
function handleInstituteInquiry(ss, data) {
  var sheetName = '기관협력문의';
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  if (sheet.getLastRow() === 0) {
    var headerRange = sheet.getRange(1, 1, 1, 5);
    headerRange.setValues([['접수일시', '기관명·소속', '협력 희망 형태', '규모·시기', '연락처']]);
    headerRange.setBackground('#45451F');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    sheet.setRowHeight(1, 36);
  }

  var now = new Date();
  var timestamp = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  var orgName = data.orgName || '';
  var cooperationType = data.cooperationType || '';
  var scaleTiming = data.scaleTiming || '';
  var contact = data.contact || '';

  sheet.appendRow([timestamp, orgName, cooperationType, scaleTiming, contact]);

  // 접수 즉시 이메일로 알림
  try {
    var subject = '[VisionEduLink Lab] 새로운 기관 협력 문의가 접수되었습니다';
    var body =
      '새로운 기관 협력 문의가 접수되었습니다.\n\n' +
      '기관명·소속: ' + (orgName || '(없음)') + '\n' +
      '협력 희망 형태: ' + (cooperationType || '(없음)') + '\n' +
      '규모·시기: ' + (scaleTiming || '(없음)') + '\n' +
      '연락처: ' + (contact || '(없음)') + '\n' +
      '접수시각: ' + timestamp;
    MailApp.sendEmail(INQUIRY_NOTIFY_EMAIL, subject, body);
  } catch (mailErr) {
    Logger.log('이메일 알림 전송 실패(시트 저장은 정상 완료됨): ' + mailErr);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ result: 'success', row: sheet.getLastRow() })
  ).setMimeType(ContentService.MimeType.JSON);
}

// GET 요청 테스트용 (배포 후 웹 앱 URL로 브라우저 접속 시 작동 확인)
function doGet(e) {
  return ContentService.createTextOutput('VisionEduLink Lab 수강 신청 API가 정상 작동 중입니다. (POST 요청 대기)').setMimeType(ContentService.MimeType.TEXT);
}

/**
 * 카카오 access_token을 refresh_token으로 갱신해서 반환합니다.
 * (access_token은 약 6시간 후 만료되므로 매번 새로 갱신해서 사용합니다)
 */
function getKakaoAccessToken() {
  var props = PropertiesService.getScriptProperties();
  var refreshToken = props.getProperty('KAKAO_REFRESH_TOKEN');

  if (!refreshToken) {
    throw new Error('카카오 refresh_token이 없습니다. exchangeKakaoTokenOnce()를 먼저 실행해주세요.');
  }

  var url = 'https://kauth.kakao.com/oauth/token';
  var payload = {
    grant_type: 'refresh_token',
    client_id: KAKAO_CLIENT_ID,
    client_secret: KAKAO_CLIENT_SECRET,
    refresh_token: refreshToken
  };
  var options = {
    method: 'post',
    payload: payload,
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var data = JSON.parse(response.getContentText());

  if (data.access_token) {
    props.setProperty('KAKAO_ACCESS_TOKEN', data.access_token);
    // 카카오는 갱신할 때마다 refresh_token을 새로 줄 수도 있음 -> 있으면 같이 저장
    if (data.refresh_token) {
      props.setProperty('KAKAO_REFRESH_TOKEN', data.refresh_token);
    }
    return data.access_token;
  }

  throw new Error('카카오 토큰 갱신 실패: ' + response.getContentText());
}

/**
 * 카카오톡 "나에게 보내기"로 알림 메시지를 전송합니다.
 */
function sendKakaoNotification(message) {
  var accessToken = getKakaoAccessToken();

  var url = 'https://kapi.kakao.com/v2/api/talk/memo/default/send';
  var templateObject = {
    object_type: 'text',
    text: message,
    link: {
      web_url: 'https://no1-phi.vercel.app',
      mobile_web_url: 'https://no1-phi.vercel.app'
    }
  };

  var options = {
    method: 'post',
    headers: {
      Authorization: 'Bearer ' + accessToken
    },
    payload: {
      template_object: JSON.stringify(templateObject)
    },
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  Logger.log('카카오 알림 전송 결과: ' + response.getContentText());
}

/**
 * (일회성 사용 완료) 카카오 OAuth 인증 코드를 access_token/refresh_token으로 교환합니다.
 * 이미 실행 완료되어 토큰이 저장되어 있으므로 더 이상 실행할 필요가 없습니다.
 */
function exchangeKakaoTokenOnce() {
  Logger.log('이미 토큰 교환이 완료되었습니다. 다시 실행할 필요 없습니다.');
}

/**
 * 카카오 알림이 잘 오는지 수동으로 테스트해보는 함수입니다.
 * 함수 목록에서 testKakaoNotification을 선택하고 실행 버튼을 누르면
 * 바로 카카오톡으로 테스트 메시지가 옵니다.
 */
function testKakaoNotification() {
  sendKakaoNotification('🔔 테스트 알림입니다. 이 메시지가 보이면 정상 작동 중이에요!');
}
