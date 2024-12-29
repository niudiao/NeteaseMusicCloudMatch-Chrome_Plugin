
// let userInfo = {};
// let songList = [];

console.log('Background script loaded.');

// getUserInfo()
//   .then(info => {
//     userInfo = info;
//     console.log('User info saved:', userInfo);
//   })

// saveSongList()
//   .then(list => {
//     songList = list;
//     console.log('Song list saved:', songList);
//   })
//   .catch(err => {
//     console.error('Error saving song list:', err);
//   })

chrome.action.onClicked.addListener((tab) => {
  // 打开标签页
  chrome.tabs.create({
    url: chrome.runtime.getURL("popup.html")
  });
});

// 监听来自content-script的消息，执行相应的命令
// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//   switch (request.action) {

//     case 'refreshUserInfo':
//         getUserInfo()
//           .then(info => {
//             userInfo = info;
//             console.log('User info saved:', userInfo);
//             sendResponse(userInfo);
//           })
//           .catch(err => {
//             console.error('Error saving user info:', err);
//           })
//         return true;

//     case 'getUserInfo':
//       sendResponse(userInfo);
//       return true;

//     case 'refreshSongList':
//       saveSongList()
//         .then(list => {
//           songList = list;
//           console.log('Song list saved:', songList);
//           sendResponse(songList);
//         })
//         .catch(err => {
//           console.error('Error saving song list:', err);
//         })
//       return true;

//     case 'getSongList':
//       sendResponse(songList);
//       return true;

//     default:
//       sendResponse("Hi");
//       break;
//   }

// });

/** 
 * 保存歌曲列表到 songList
 */
// function saveSongList() {
//   // 先获取歌曲数量
//   return getSongList(0, 0).then(data => {
//     // 在获取全部
//     return getSongList(data.count, 0).then(data => {
//       return data.data;
//     });
//   })
// }


/**
 * 获取用户信息
 */
// function getUserInfo() {
//   // 获取用户信息
//   return fetch("https://music.163.com/api/nuser/account/get", {
//     method: 'GET',
//     include: 'credentials'
//   })
//     .then(response => {
//       if (!response.ok) {
//         throw new Error('Network response was not ok');
//       }
//       return response.json();
//     })
//     .then(data => {
//       return data;
//     })
//     .catch(error => {
//       console.error('There was a problem with the fetch operation:', error);
//     });
// }


/**
 * 获取歌曲列表
 * @param {number} limit
 * @param {number} offset
 */
// function getSongList(limit, offset) {
//   // 校验参数
//   if (limit === null || offset === null || limit < 0 || offset < 0) {
//     console.error('Invalid parameters:', limit, offset);
//     return;
//   }
//   return fetch(`https://music.163.com/api/v1/cloud/get?limit=${limit}&offset=${offset}`, {
//     method: 'GET',
//     include: 'credentials'
//   })
//     .then(response => {
//       if (!response.ok) {
//         console.error('Network response was not ok:', response.statusText);
//       }
//       return response.json();
//     })
//     .then(data => {
//       return data;
//     })
//     .catch(error => {
//       console.error('There was a problem with the fetch operation:', error);
//     });
// }