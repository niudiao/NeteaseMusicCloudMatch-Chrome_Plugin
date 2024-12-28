
let userInfo = {};
let cloudInfo = {};
let songList = [];

let app = {};
let limit = 20;
let offset = 0;
let page = 1;
let originalSongId = '';
let userId = '';


/**
 * DOMContentLoaded 监听当前页面的HTML加载完成
 */
document.addEventListener('DOMContentLoaded', function () {
    app = document.getElementById('app');

    // 获取用户和网盘信息并绑定
    getUserInfo();
    getCloudInfo();

    // 创建表格
    let table = createTable();
    // 向后台请求歌曲列表
    chrome.runtime.sendMessage({ action: "getSongList" }, function (response) {
        // console.log('Popup script received:', response);
        if (response) {
            songList = response;
            fillTable(table, getSongList(limit, offset));
        }
    });

    // 初始化歌曲页码
    app.querySelector('#input_songs_page').value = page;

    // profile刷新按钮
    app.querySelector('#btn_profile_refresh').addEventListener('click', function () {
        showNotification('基本信息刷新中...');
        // 禁用按钮
        this.disabled = true;
        chrome.runtime.sendMessage({ action: "refreshUserInfo" }, function (response) {
            userInfo = response;
            bindUserInfo(userInfo);
        })
        getUserInfo();
        getCloudInfo();
        // 3秒后启用按钮
        setTimeout(() => {
            this.disabled = false;
        }, 3000);
    });

    // 歌曲刷新按钮
    app.querySelector('#btn_songs_refresh').addEventListener('click', function () {
        showNotification('歌曲刷新中...');
        // 禁用按钮
        this.disabled = true;
        chrome.runtime.sendMessage({ action: "refreshSongList" }, function (response) {
            if (response) {
                songList = response;
                console.log('刷新歌曲列表');
                fillTable(table, getSongList(limit, offset));
            }
        });
        // 3秒后启用按钮
        setTimeout(() => {
            this.disabled = false;
        }, 3000);
    });

    // 首页
    app.querySelector('#btn_songs_first').addEventListener('click', function () {
        page = 1;
        offset = (page - 1) * limit;
        fillTable(table, getSongList(limit, offset));
        app.querySelector('#input_songs_page').value = page;
    });
    // 上一页
    app.querySelector('#btn_songs_prev').addEventListener('click', function () {
        page--;
        if (page < 1) {
            showNotification('已经是第一页了');
            page = 1;
        }
        offset = (page - 1) * limit;
        fillTable(table, getSongList(limit, offset));
        app.querySelector('#input_songs_page').value = page;
    });
    // 跳转页码
    app.querySelector('#input_songs_page').addEventListener('change', function (e) {
        if (e.target.value < 1) {
            showNotification('页码不能小于1');
            return;
        } else if (e.target.value > Math.ceil(songList.length / limit)) {
            showNotification('页码不能大于总页数: ' + Math.ceil(songList.length / limit));
            e.target.value = Math.ceil(songList.length / limit);
        }
        offset = (e.target.value - 1) * limit;
        page = e.target.value;
        fillTable(table, getSongList(limit, offset));
        app.querySelector('#input_songs_page').value = page;
    });
    // 下一页
    app.querySelector('#btn_songs_next').addEventListener('click', function () {
        page++;
        if (page > Math.ceil(songList.length / limit)) {
            showNotification('已经是最后一页了');
            page = Math.ceil(songList.length / limit);
            return;
        }
        offset = (page - 1) * limit;
        fillTable(table, getSongList(limit, offset));
        app.querySelector('#input_songs_page').value = page;
    });
    // 尾页
    app.querySelector('#btn_songs_last').addEventListener('click', function () {
        page = Math.ceil(songList.length / limit);
        offset = (page - 1) * limit;
        fillTable(table, getSongList(limit, offset));
        app.querySelector('#input_songs_page').value = page;
    });

    // 匹配专辑,当前页面歌曲匹配
    app.querySelector('#input_albumId').addEventListener('change', function (e) {
        let match_songs = {};
        let songIds = [];
        // 当前页面歌曲
        getSongList(limit, offset).forEach(song => {
            match_songs[song.songName] = { "sid": '', "asid": '' };
            match_songs[song.songName].sid = song.songId;
            songIds.push(song.songId);
        });
        // 获取云专辑歌曲信息
        fetch(`https://music.163.com/api/album/${e.target.value}`)
            .then(response => response.json())
            .then(data => {
                album = data.album;
                console.log('请确认专辑信息', album.name, album.artist.name);
                album.songs.forEach(song => {
                    console.log(song.id, song.name);
                    if (!match_songs[song.name]) {
                        return;
                    }
                    match_songs[song.name].asid = song.id;
                });

                Object.keys(match_songs).forEach(songName => {
                    if (match_songs[songName].asid == '') {
                        console.log(songName, '不在该专辑中');
                    } else if (match_songs[songName].sid === match_songs[songName].asid) {
                        console.log(songName, '已匹配', match_songs[songName].sid, match_songs[songName].asid);
                        // matchSong(match_songs[songName].sid, match_songs[songName].asid);
                    } else {
                        console.log(songName, '待匹配', match_songs[songName].sid, match_songs[songName].asid);
                        // matchSong(match_songs[songName].sid, match_songs[songName].asid);
                    }
                })
            });
        console.log("匹配歌曲列表中", match_songs);
    });

    // 取消专辑匹配
    app.querySelector('#cancel_album_match').addEventListener('change', function (e) {
        console.log('取消专辑匹配');
        let uid = userInfo.profile.id;
        fetch(`https://music.163.com/api/album/${e.target.value}`)
            .then(response => response.json())
            .then(data => {
                album = data.album;
                console.log('请确认专辑信息', album.name, album.artist.name);
                album.songs.forEach(song => {
                    console.log(song.id, song.name);
                    fetch(`https://music.163.com/api/cloud/user/song/match?userId=${uid}&songId=${song.id}&adjustSongId=0`)
                        .then(response => response.json())
                        .then(data => {
                            console.log(data);
                        })
                        .catch(error => {
                            console.log(error);
                        })
                });
            });
    })

    // 取消单曲匹配
    app.querySelector('#cancel_song_match').addEventListener('change', function (e) {
        console.log('取消单曲匹配');
        let uid = userInfo.profile.id;
        fetch(`https://music.163.com/api/cloud/user/song/match?userId=${uid}&songId=${e.target.value}&adjustSongId=0`)
            .then(response => response.json())
            .then(data => {
                console.log(data);
            })
            .catch(error => {
                console.log(error);
            })
    })

    // 歌曲搜索
    app.querySelector('#input_songs_search').addEventListener('change', function (e) {
        let search = e.target.value;
        // 模糊搜索
        if (!search) {
            return;
        }
        // 对歌曲名、歌手名、专辑名进行模糊搜索
        let searchList = songList.filter(song => {
            return song.songName.toLowerCase().includes(search.toLowerCase()) || 
                   song.artist.toLowerCase().includes(search.toLowerCase()) ||
                   song.album.toLowerCase().includes(search.toLowerCase()) ||
                   song.fileName.toLowerCase().includes(search.toLowerCase());
        });
        fillTable(table, searchList);

    })  

});


/**
 * 创建表格元素
 * @returns table
 */
function createTable() {
    let table = app.querySelector('#tb_songs');

    // 表头
    let thead = document.createElement('thead');
    let tbody = document.createElement('tbody');
    tbody.id = 'song_table_body';

    let tr = document.createElement('tr');
    let th_no = document.createElement('th');
    th_no.style.width = '20px';
    let th_addTime = document.createElement('th');
    let th_album = document.createElement('th');
    let th_artist = document.createElement('th');
    let th_bitrate = document.createElement('th');
    let th_fileName = document.createElement('th');
    let th_fileSize = document.createElement('th');
    let th_songId = document.createElement('th');
    let th_songName = document.createElement('th');
    let th_picUrl = document.createElement('th');
    // let th_cover = document.createElement('th');
    // let th_coverId = document.createElement('th');
    // let th_lyricId = document.createElement('th');
    // let th_version = document.createElement('th');

    th_no.textContent = '#';
    th_addTime.textContent = '添加时间';
    th_album.textContent = '专辑';
    th_artist.textContent = '歌手';
    th_bitrate.textContent = '比特率';
    th_fileName.textContent = '文件名';
    th_fileSize.textContent = '文件大小';
    th_songId.textContent = '歌曲ID';
    th_songName.textContent = '歌曲名';
    th_picUrl.textContent = '图片';
    // th_cover.textContent = '封面';
    // th_coverId.textContent = '封面ID';
    // th_lyricId.textContent = '歌词ID';
    // th_version.textContent = '版本';

    tr.appendChild(th_no);
    tr.appendChild(th_addTime);
    tr.appendChild(th_album);
    tr.appendChild(th_artist);
    tr.appendChild(th_bitrate);
    tr.appendChild(th_fileName);
    tr.appendChild(th_fileSize);
    tr.appendChild(th_songId);
    tr.appendChild(th_songName);
    tr.appendChild(th_picUrl);
    // tr.appendChild(th_cover);
    // tr.appendChild(th_coverId);
    // tr.appendChild(th_lyricId);
    // tr.appendChild(th_version);

    thead.appendChild(tr);
    table.appendChild(thead);
    table.appendChild(tbody);

    return table;
}


/**
 * 填充表格数据
 * @param {Element} t 表格元素
 * @param {Object} d 数据
 * @returns
 */
function fillTable(t, d) {
    let tbody = t.querySelector('#song_table_body');
    tbody.innerHTML = '';
    let number = 1;

    d.forEach(item => {
        let tr = document.createElement('tr');

        let td_no = document.createElement('td');
        let td_addTime = document.createElement('td');
        let td_album = document.createElement('td');
        let td_artist = document.createElement('td');
        let td_bitrate = document.createElement('td');
        let tdd_fileName = document.createElement('td');
        let td_fileSize = document.createElement('td');
        let td_songId = document.createElement('td');
        let input_songId = document.createElement('input');
        let td_songName = document.createElement('td');
        let td_picUrl = document.createElement('td');
        let img_picUrl = document.createElement('img');
        img_picUrl.style.width = '50px';
        td_picUrl.appendChild(img_picUrl);
        // let td_cover = document.createElement('td');
        // let td_coverId = document.createElement('td');
        // let td_lyricId = document.createElement('td');
        // let td_version = document.createElement('td');

        td_no.textContent = number++;
        td_addTime.textContent = convertTimestampToReadableDate(item.addTime).replace(" ", "\n");
        td_album.textContent = item.album;
        td_artist.textContent = item.artist;
        td_bitrate.textContent = item.bitrate;
        tdd_fileName.textContent = item.fileName;
        td_fileSize.textContent = (item.fileSize / 1024 / 1024).toFixed(1) + 'MB';
        input_songId.value = item.songId;
        td_songName.textContent = item.songName;
        img_picUrl.src = item.simpleSong.al !== null ? item.simpleSong.al.picUrl : '';
        // td_cover.textContent = item.cover;
        // td_coverId.textContent = item.coverId;
        // td_lyricId.textContent = item.lyricId;
        // td_version.textContent = item.version;

        tr.appendChild(td_no);
        tr.appendChild(td_addTime);
        tr.appendChild(td_album);
        tr.appendChild(td_artist);
        tr.appendChild(td_bitrate);
        tr.appendChild(tdd_fileName);
        tr.appendChild(td_fileSize);
        td_songId.appendChild(input_songId);
        tr.appendChild(td_songId);
        tr.appendChild(td_songName);
        tr.appendChild(td_picUrl);
        // tr.appendChild(td_cover);
        // tr.appendChild(td_coverId);
        // tr.appendChild(td_lyricId);
        // tr.appendChild(td_version);

        tbody.appendChild(tr);

        // 输入框聚焦事件
        input_songId.addEventListener('focus', e => {
            console.log('input_songId focused:', e.target.value);
            originalSongId = e.target.value;
        });

        // 输入框改变事件
        input_songId.addEventListener('change', e => {
            console.log('input_songId changed:', e.target.value);
            matchSong(originalSongId, e.target.value);
        });

    });
}


/**
 * 将时间戳转换为可读日期格式
 * @param {number} timestamp 时间戳
 * @returns {string} 可读日期格式
 */
function convertTimestampToReadableDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}


/**
 * 获取用户信息
 */
function getUserInfo() {
    chrome.runtime.sendMessage({ action: 'getUserInfo' }, response => {
        userInfo = response;
        bindUserInfo(userInfo);
    })
}


/**
 * 获取网盘信息
 */
function getCloudInfo() {
    fetch("https://music.163.com/api/v1/cloud/get?limit=0", {
        method: 'GET',
        include: 'credentials'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Data cloud retrieved:', data);
            cloudInfo = data;
            bindCloudInfo();
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}


/**
 * 用户数据绑定
 */
function bindUserInfo(userInfo) {
    if (!userInfo) {
        console.error('Invalid userInfo:', userInfo);
        return;
    }
    let userProfile = userInfo.profile;

    // 头像
    let img_avatar = app.querySelector('#img_avatar');
    img_avatar.src = userProfile.avatarUrl;

    // 用户信息
    const p_profile = app.querySelectorAll('#dv_user_info p');
    p_profile.forEach(p => {
        if (userProfile[p.id]) {
            if (p.id.includes('Time')) {
                p.textContent = convertTimestampToReadableDate(userProfile[p.id]);
            } else {
                p.textContent = userProfile[p.id];
            }
        }
    });

    userId = userProfile.userId;
}


/**
 * 网盘数据绑定
 */
function bindCloudInfo() {
    if (!cloudInfo) {
        console.error('Invalid cloudInfo:', cloudInfo);
        return;
    }

    // 网盘信息
    const p_cloud = app.querySelectorAll('#dv_cloud_info p');
    p_cloud.forEach(p => {
        if (cloudInfo[p.id]) {

            if (p.id.toLowerCase().includes('size')) {
                p.textContent = (cloudInfo[p.id] / 1024 / 1024).toFixed(0) + 'MB';
            } else {
                p.textContent = cloudInfo[p.id];
            }

            // 进度条
            let progress = app.querySelector('#capacity_progress');
            progress.value = cloudInfo['size'];
            progress.max = cloudInfo['maxSize'];
        }
    });
}


/**
 * 获取歌曲列表
 * @param {number} limit
 * @param {number} offset
 */
function getSongList(limit, offset) {
    // 校验参数
    if (limit === null || offset === null || limit < 0 || offset < 0) {
        console.error('Invalid parameters:', limit, offset);
        return;
    }
    // 从 List songList 获取
    return songList.slice(offset, offset + limit);

    // 从请求中获取
    // return fetch(`https://music.163.com/api/v1/cloud/get?limit=${limit}&offset=${offset}`, {
    //     method: 'GET',
    //     include: 'credentials'
    // })
    //     .then(response => {
    //         if (!response.ok) {
    //             throw new Error('Network response was not ok');
    //         }
    //         return response.json();
    //     })
    //     .then(data => {
    //         console.log('Data songs retrieved:', data);
    //         return data;
    //     })
    //     .catch(error => {
    //         console.error('There was a problem with the fetch operation:', error);
    //     });
}

/**
 * 匹配歌曲
 * @param {number} sid
 * @param {number} asid
 */
function matchSong(sid, asid) {
    let uid = userId;
    console.log('matchSong', uid, sid, asid);

    // 判断是否为空
    if (!uid || !sid || !asid) {
        console.error('Invalid parameters:', uid, sid, asid);
        return;
    }

    fetch(`https://music.163.com/api/cloud/user/song/match?userId=${uid}&songId=${sid}&adjustSongId=${asid}`, {
        method: 'GET',
        include: 'credentials'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Data matchSong retrieved:', data);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

/**
 * 弹出消息提醒弹窗
 */
function showNotification(message, duration = 3000) {
    const notification = app.querySelector('#dv_notification');
    notification.textContent = message;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, duration);
}