var API = 'http://localhost:3000/api';

function navigate(page, params) {
  params = params || {};
  var app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(renderNavbar());
  var content = document.createElement('div');
  content.className = 'content';
  if (page === 'home') content.appendChild(renderHome());
  else if (page === 'login') content.appendChild(renderLogin());
  else if (page === 'register') content.appendChild(renderRegister());
  else if (page === 'ad-detail') content.appendChild(renderAdDetail(params.id));
  else if (page === 'admin') content.appendChild(renderAdmin());
  else if (page === 'create-ad') content.appendChild(renderCreateAd());
  else if (page === 'chat') content.appendChild(renderChat());
  else if (page === 'chat-window') content.appendChild(renderChatWindow(params.chatId, params.title));
  else if (page === 'profile') content.appendChild(renderProfile(params.userId));
  else if (page === 'favorites') content.appendChild(renderFavorites());
  else content.appendChild(renderHome());
  app.appendChild(content);
}

function renderNavbar() {
  var nav = document.createElement('nav');
  nav.className = 'navbar';
  var token = localStorage.getItem('token');
  var user = JSON.parse(localStorage.getItem('user') || 'null');
  var links = '';
  if (token) {
    links += '<span style="color:#8892A4;font-size:14px">РџСЂРёРІРµС‚, ' + (user ? user.name : '') + '</span>';
    links += '<button class="btn btn-outline" id="btn-profile-nav">рџ‘¤ РџСЂРѕС„РёР»СЊ</button>';
    links += '<button class="btn btn-outline" id="btn-chat-nav">рџ’¬ Р§Р°С‚С‹</button>';
    links += '<button class="btn btn-outline" id="btn-favorites-nav">в™Ў РР·Р±СЂР°РЅРЅРѕРµ</button>';
    if (user && (user.role === 'admin' || user.role === 'moderator')) {
      links += '<button class="btn btn-outline" id="btn-admin">РђРґРјРёРЅ РїР°РЅРµР»СЊ</button>';
    }
    links += '<button class="btn btn-outline" id="btn-logout">Р’С‹Р№С‚Рё</button>';
  } else {
    links += '<button class="btn btn-outline" id="btn-login">Р’РѕР№С‚Рё</button>';
    links += '<button class="btn btn-primary" id="btn-register">Р РµРіРёСЃС‚СЂР°С†РёСЏ</button>';
  }
  nav.innerHTML = '<div class="navbar-logo">Lekofy</div><div class="navbar-links">' + links + '</div>';
  nav.querySelector('.navbar-logo').onclick = function() { navigate('home'); };
  if (token) {
    var lb = nav.querySelector('#btn-logout');
    if (lb) lb.onclick = function() { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('home'); };
    var ab = nav.querySelector('#btn-admin');
    if (ab) ab.onclick = function() { navigate('admin'); };
    var cb = nav.querySelector('#btn-chat-nav');
    if (cb) cb.onclick = function() { navigate('chat'); };
    var fb = nav.querySelector('#btn-favorites-nav'); 
    if (fb) fb.onclick = function() { navigate('favorites'); };
    var pb = nav.querySelector('#btn-profile-nav');
    if (pb) pb.onclick = function() { navigate('profile', { userId: user.id }); };
  } else {
    nav.querySelector('#btn-login').onclick = function() { navigate('login'); };
    nav.querySelector('#btn-register').onclick = function() { navigate('register'); };
  }
  return nav;
}

function renderHome() {
  var div = document.createElement('div');
  div.innerHTML = '<div class="hero">'
    + '<h1>Lekofy</h1>'
    + '<p>РџРѕРєСѓРїР°Р№С‚Рµ Рё РїСЂРѕРґР°РІР°Р№С‚Рµ Р»РµРіРєРѕ РїРѕ РІСЃРµРјСѓ РљС‹СЂРіС‹Р·СЃС‚Р°РЅСѓ</p>'
    + '<div class="search-bar"><input type="text" id="search-input" placeholder="РџРѕРёСЃРє РѕР±СЉСЏРІР»РµРЅРёР№..." />'
    + '<button class="btn btn-primary" id="btn-search">РќР°Р№С‚Рё</button></div></div>'
    + '<div class="filters">'
    + '<select id="filter-category"><option value="">Р’СЃРµ РєР°С‚РµРіРѕСЂРёРё</option>'
    + '<option value="electronics">Р­Р»РµРєС‚СЂРѕРЅРёРєР°</option>'
    + '<option value="transport">РўСЂР°РЅСЃРїРѕСЂС‚</option>'
    + '<option value="realty">РќРµРґРІРёР¶РёРјРѕСЃС‚СЊ</option>'
    + '<option value="clothes">РћРґРµР¶РґР°</option>'
    + '<option value="furniture">РњРµР±РµР»СЊ</option>'
    + '<option value="jobs">Р Р°Р±РѕС‚Р°</option>'
    + '<option value="services">РЈСЃР»СѓРіРё</option>'
    + '<option value="other">Р”СЂСѓРіРѕРµ</option></select>'
    + '<input type="number" id="filter-min" placeholder="Р¦РµРЅР° РѕС‚" style="width:120px" />'
    + '<input type="number" id="filter-max" placeholder="Р¦РµРЅР° РґРѕ" style="width:120px" />'
    + '<button class="btn btn-primary" id="btn-filter">РџСЂРёРјРµРЅРёС‚СЊ</button>'
    + (localStorage.getItem('token') ? '<button class="btn btn-primary" id="btn-create" style="margin-left:auto">+ РџРѕРґР°С‚СЊ РѕР±СЉСЏРІР»РµРЅРёРµ</button>' : '')
    + '</div>'
    + '<div id="ads-container" class="ads-grid"><div class="loading">Р—Р°РіСЂСѓР·РєР° РѕР±СЉСЏРІР»РµРЅРёР№...</div></div>';

  function loadAds(params) {
    var container = div.querySelector('#ads-container');
    container.innerHTML = '<div class="loading">Р—Р°РіСЂСѓР·РєР°...</div>';
    var query = [];
    if (params && params.search) query.push('search=' + encodeURIComponent(params.search));
    if (params && params.category) query.push('category=' + params.category);
    if (params && params.minPrice) query.push('minPrice=' + params.minPrice);
    if (params && params.maxPrice) query.push('maxPrice=' + params.maxPrice);
    fetch(API + '/ads?' + query.join('&'))
      .then(function(r) { return r.json(); })
      .then(function(ads) {
        container.innerHTML = '';
        if (!ads.length) { container.innerHTML = '<div class="empty">РћР±СЉСЏРІР»РµРЅРёР№ РЅРµ РЅР°Р№РґРµРЅРѕ</div>'; return; }
        ads.forEach(function(ad) { container.appendChild(renderAdCard(ad)); });
      })
      .catch(function() { container.innerHTML = '<div class="empty">РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё. Р—Р°РїСѓС‰РµРЅ Р»Рё СЃРµСЂРІРµСЂ?</div>'; });
  }

  div.querySelector('#btn-search').onclick = function() { loadAds({ search: div.querySelector('#search-input').value }); };
  div.querySelector('#btn-filter').onclick = function() {
    loadAds({
      search: div.querySelector('#search-input').value,
      category: div.querySelector('#filter-category').value,
      minPrice: div.querySelector('#filter-min').value,
      maxPrice: div.querySelector('#filter-max').value
    });
  };
  div.querySelector('#search-input').onkeydown = function(e) { if (e.key === 'Enter') loadAds({ search: e.target.value }); };
  var createBtn = div.querySelector('#btn-create');
  if (createBtn) createBtn.onclick = function() { navigate('create-ad'); };
  loadAds();
  return div;
}

function renderAdCard(ad) {
  var card = document.createElement('div');
  card.className = 'ad-card';
  var imgHtml = (ad.images && ad.images.length > 0)
    ? '<img src="' + ad.images[0] + '" alt="' + ad.title + '" />'
    : '<div class="ad-card-no-img">&#127991;</div>';
  card.innerHTML = imgHtml
    + '<div class="ad-card-body">'
    + '<div class="ad-card-title">' + ad.title + '</div>'
    + '<div class="ad-card-price">' + Number(ad.price).toLocaleString() + ' СЃРѕРј</div>'
    + '<div class="ad-card-meta"><span>&#128205; ' + (ad.city || 'РќРµ СѓРєР°Р·Р°РЅ') + '</span><span>&#128065; ' + (ad.views || 0) + '</span></div>'
    + '</div>';
  card.onclick = function() { navigate('ad-detail', { id: ad.id }); };
  return card;
}

function renderFavorites() {
  var token = localStorage.getItem('token');
  if (!token) { navigate('login'); return document.createElement('div'); }
  var div = document.createElement('div');
  div.innerHTML = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">'
    + '<button class="btn btn-outline" id="btn-back-fav" style="color:#333;border-color:#ddd">&#8592; РќР°Р·Р°Рґ</button>'
    + '<h2 style="font-size:22px;font-weight:800">в™Ў РР·Р±СЂР°РЅРЅРѕРµ</h2>'
    + '</div>'
    + '<div id="fav-container" class="ads-grid"><div class="loading">Р—Р°РіСЂСѓР·РєР°...</div></div>';

  div.querySelector('#btn-back-fav').onclick = function() { navigate('home'); };

  function renderFavoriteCard(ad) {
    var card = renderAdCard(ad);
    card.style.position = 'relative';
    var removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-danger btn-sm';
    removeBtn.textContent = 'в™Ґ РЈР±СЂР°С‚СЊ';
    removeBtn.style.position = 'absolute';
    removeBtn.style.top = '12px';
    removeBtn.style.right = '12px';
    removeBtn.style.background = 'rgba(255,71,87,0.95)';
    removeBtn.onclick = function(e) {
      e.stopPropagation();
      fetch(API + '/favorites/' + ad.id, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      }).then(function(r) { return r.json(); })
        .then(function(data) {
          if (data && data.error) { alert(data.error); return; }
          showToast('РЈРґР°Р»РµРЅРѕ РёР· РёР·Р±СЂР°РЅРЅРѕРіРѕ');
          loadFavorites();
        }).catch(function() { alert('РћС€РёР±РєР° СѓРґР°Р»РµРЅРёСЏ РёР· РёР·Р±СЂР°РЅРЅРѕРіРѕ'); });
    };
    card.appendChild(removeBtn);
    return card;
  }

  function loadFavorites() {
    var container = div.querySelector('#fav-container');
    container.innerHTML = '<div class="loading">Р—Р°РіСЂСѓР·РєР°...</div>';
    fetch(API + '/favorites', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(function(r) { return r.json(); })
      .then(function(ads) {
        container.innerHTML = '';
        if (!Array.isArray(ads) || !ads.length) {
          container.innerHTML = '<div class="empty">Р’ РёР·Р±СЂР°РЅРЅРѕРј РїРѕРєР° РїСѓСЃС‚Рѕ</div>';
          return;
        }
        ads.forEach(function(ad) { container.appendChild(renderFavoriteCard(ad)); });
      })
      .catch(function() { container.innerHTML = '<div class="empty">РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РёР·Р±СЂР°РЅРЅРѕРіРѕ</div>'; });
  }

  loadFavorites();
  return div;
}

function renderAdDetail(id) {
  var div = document.createElement('div');
  div.innerHTML = '<div class="loading">Р—Р°РіСЂСѓР·РєР°...</div>';
  fetch(API + '/ads/' + id)
    .then(function(r) { return r.json(); })
    .then(function(ad) {
      var token = localStorage.getItem('token');
      var user = JSON.parse(localStorage.getItem('user') || 'null');

      var imgHtml = '';
      if (ad.images && ad.images.length > 0) {
        imgHtml = '<img id="main-img" src="' + ad.images[0] + '" style="width:100%;max-height:500px;height:auto;object-fit:contain;background:#f8f8f8;display:block;" />';
        if (ad.images.length > 1) {
          imgHtml += '<div style="display:flex;gap:8px;padding:12px;background:#f8f8f8;">';
          ad.images.forEach(function(img, i) {
            imgHtml += '<img src="' + img + '" data-src="' + img + '" style="width:70px;height:70px;object-fit:cover;border-radius:8px;cursor:pointer;border:2px solid ' + (i === 0 ? '#0EA5E9' : '#ddd') + '" class="thumb" />';
          });
          imgHtml += '</div>';
        }
      } else {
        imgHtml = '<div style="width:100%;height:300px;background:linear-gradient(135deg,#0A0E1A,#1a2040);display:flex;align-items:center;justify-content:center;font-size:60px;">&#127991;</div>';
      }

      var phoneHtml = '';
      if (ad.phone) {
        phoneHtml = '<div style="background:#f0fff8;border:1px solid #05E0A0;border-radius:12px;padding:16px 20px;margin-bottom:16px;cursor:pointer" id="phone-box">'
          + '<div style="font-size:13px;color:#888;margin-bottom:4px">РќРѕРјРµСЂ РїСЂРѕРґР°РІС†Р°</div>'
          + '<div style="font-size:18px;font-weight:700">&#128222; ' + ad.phone + ' <span style="font-size:12px;color:#888">&#9660;</span></div>'
          + '</div>'
          + '<div id="phone-menu" style="display:none;background:white;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.15);overflow:hidden;margin-bottom:16px;">'
          + '<a href="tel:' + ad.phone.replace(/[^0-9+]/g, '') + '" class="phone-menu-item">'
          + '<span style="font-size:24px">&#128222;</span><div><div style="font-weight:600">РџРѕР·РІРѕРЅРёС‚СЊ</div><div style="font-size:12px;color:#888">' + ad.phone + '</div></div></a>'
          + '<a href="https://wa.me/' + ad.phone.replace(/[^0-9]/g, '') + '" target="_blank" class="phone-menu-item">'
          + '<span style="font-size:24px">&#128172;</span><div><div style="font-weight:600">WhatsApp</div><div style="font-size:12px;color:#888">РќР°РїРёСЃР°С‚СЊ РІ WhatsApp</div></div></a>'
          + '<a href="https://wa.me/' + ad.phone.replace(/[^0-9]/g, '') + '" target="_blank" class="phone-menu-item">'
          + '<span style="font-size:24px">&#127970;</span><div><div style="font-weight:600">WhatsApp Business</div><div style="font-size:12px;color:#888">РќР°РїРёСЃР°С‚СЊ РІ WhatsApp Business</div></div></a>'
          + '</div>';
      }

      var isAdmin = user && (user.role === 'admin' || user.role === 'moderator');
      var isOwner = user && ad.userId === user.id;
      var actionBtns = '';
      if (token) {
        actionBtns += '<button class="btn btn-primary" id="btn-chat" style="width:100%;padding:14px;font-size:15px;margin-bottom:10px">&#128172; РќР°РїРёСЃР°С‚СЊ РІ Lekofy С‡Р°С‚</button>';
        actionBtns += '<button class="btn btn-danger" id="btn-report" style="width:100%;padding:10px;font-size:13px;background:#fff;color:#ff4757;border:1px solid #ff4757">&#128681; РџРѕР¶Р°Р»РѕРІР°С‚СЊСЃСЏ</button>';
        actionBtns += '<button class="btn btn-outline" id="btn-fav" style="width:100%;padding:10px;font-size:13px;margin-top:10px;color:#333;border-color:#ddd">в™Ў Р’ РёР·Р±СЂР°РЅРЅРѕРµ</button>';
      } else {
        actionBtns += '<button class="btn btn-outline" id="btn-login-chat" style="width:100%;padding:14px;font-size:15px;margin-bottom:10px;color:#333;border-color:#ddd">Р’РѕР№РґРёС‚Рµ С‡С‚РѕР±С‹ РЅР°РїРёСЃР°С‚СЊ</button>';
      }
      if (isAdmin || isOwner) {
        actionBtns += '<button class="btn btn-danger" id="btn-delete-ad" style="width:100%;padding:10px;font-size:13px;margin-top:8px">&#128465; РЈРґР°Р»РёС‚СЊ РѕР±СЉСЏРІР»РµРЅРёРµ</button>';
      }

      div.innerHTML = '<div class="detail-container">'
        + '<button class="btn btn-outline" id="btn-back" style="margin-bottom:20px;color:#333;border-color:#ddd">&#8592; РќР°Р·Р°Рґ</button>'
        + '<div class="detail-box">'
        + imgHtml
        + '<div class="detail-body">'
        + '<div class="detail-title">' + ad.title + '</div>'
        + '<div class="detail-price">' + Number(ad.price).toLocaleString() + ' СЃРѕРј</div>'
        + '<div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap">'
        + (ad.category ? '<span class="badge badge-user">' + ad.category + '</span>' : '')
        + (ad.city ? '<span class="badge badge-active">&#128205; ' + ad.city + '</span>' : '')
        + '<span style="font-size:12px;color:#888;align-self:center">&#128065; ' + (ad.views || 0) + ' РїСЂРѕСЃРјРѕС‚СЂРѕРІ</span>'
        + '</div>'
        + phoneHtml
        + '<div class="detail-desc">' + (ad.description || 'РћРїРёСЃР°РЅРёРµ РЅРµ СѓРєР°Р·Р°РЅРѕ') + '</div>'
        + actionBtns
        + '<div id="similar-block" style="margin-top:32px;"></div>'
        + '</div></div></div>';

      div.querySelector('#btn-back').onclick = function() { navigate('home'); };

      // РџСЂРѕС„РёР»СЊ РїСЂРѕРґР°РІС†Р°
      if (ad.userId) {
        var titleEl = div.querySelector('.detail-title');
        if (titleEl) {
          var profileBtn = document.createElement('button');
          profileBtn.className = 'btn btn-outline';
          profileBtn.textContent = 'РџСЂРѕС„РёР»СЊ РїСЂРѕРґР°РІС†Р°';
          profileBtn.style.marginLeft = '12px';
          profileBtn.style.fontSize = '13px';
          profileBtn.onclick = function() { navigate('profile', { userId: ad.userId }); };
          titleEl.parentNode.insertBefore(profileBtn, titleEl.nextSibling);
        }
      }

      // РР·Р±СЂР°РЅРЅРѕРµ: РїРѕРґС‚СЏРіРёРІР°РµРј СЃРѕСЃС‚РѕСЏРЅРёРµ Рё РґР°С‘Рј РїРµСЂРµРєР»СЋС‡Р°С‚РµР»СЊ
      if (token) {
        var favBtn = div.querySelector('#btn-fav');
        if (favBtn) {
          favBtn.disabled = true;
          fetch(API + '/favorites', { headers: { 'Authorization': 'Bearer ' + token } })
            .then(function(r) { return r.json(); })
            .then(function(favs) {
              var isFav = Array.isArray(favs) && favs.some(function(a) { return a && a.id === ad.id; });
              function setBtn() {
                favBtn.textContent = isFav ? 'в™Ґ Р’ РёР·Р±СЂР°РЅРЅРѕРј' : 'в™Ў Р’ РёР·Р±СЂР°РЅРЅРѕРµ';
                favBtn.style.borderColor = isFav ? '#ff4757' : '#ddd';
                favBtn.style.color = isFav ? '#ff4757' : '#333';
              }
              setBtn();
              favBtn.disabled = false;
              favBtn.onclick = function() {
                favBtn.disabled = true;
                fetch(API + '/favorites/' + ad.id, {
                  method: isFav ? 'DELETE' : 'POST',
                  headers: { 'Authorization': 'Bearer ' + token }
                }).then(function(r) { return r.json(); })
                  .then(function(data) {
                    if (data && data.error) { alert(data.error); return; }
                    isFav = !isFav;
                    setBtn();
                    showToast(isFav ? 'Р”РѕР±Р°РІР»РµРЅРѕ РІ РёР·Р±СЂР°РЅРЅРѕРµ' : 'РЈРґР°Р»РµРЅРѕ РёР· РёР·Р±СЂР°РЅРЅРѕРіРѕ');
                  }).catch(function() {
                    alert('РћС€РёР±РєР° РёР·Р±СЂР°РЅРЅРѕРіРѕ');
                  }).finally(function() {
                    favBtn.disabled = false;
                  });
              };
            })
            .catch(function() {
              favBtn.disabled = false;
            });
        }
      }

      // РџРѕС…РѕР¶РёРµ РѕР±СЉСЏРІР»РµРЅРёСЏ
      var similarBlock = div.querySelector('#similar-block');
      if (similarBlock && ad.category) {
        similarBlock.innerHTML = '<h3 style="font-size:18px;font-weight:700;margin-bottom:12px">РџРѕС…РѕР¶РёРµ РѕР±СЉСЏРІР»РµРЅРёСЏ</h3><div class="ads-grid" id="similar-grid"><div class="loading">Р—Р°РіСЂСѓР·РєР°...</div></div>';
        fetch(API + '/ads/recommend?category=' + encodeURIComponent(ad.category) + (ad.city ? '&city=' + encodeURIComponent(ad.city) : '') + '&excludeId=' + ad.id + '&limit=8')
          .then(function(r) { return r.json(); })
          .then(function(list) {
            var grid = div.querySelector('#similar-grid');
            if (!grid) return;
            grid.innerHTML = '';
            if (!Array.isArray(list) || !list.length) {
              grid.innerHTML = '<div class="empty" style="padding:20px">РџРѕРєР° РЅРµС‚ РїРѕС…РѕР¶РёС… РѕР±СЉСЏРІР»РµРЅРёР№</div>';
              return;
            }
            list.forEach(function(a) {
              var card = renderAdCard(a);
              grid.appendChild(card);
            });
          })
          .catch(function() {
            var grid = div.querySelector('#similar-grid');
            if (grid) grid.innerHTML = '<div class="empty" style="padding:20px">РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё СЂРµРєРѕРјРµРЅРґР°С†РёР№</div>';
          });
      }

      div.querySelectorAll('.thumb').forEach(function(thumb) {
        thumb.onclick = function() {
          div.querySelector('#main-img').src = thumb.getAttribute('data-src');
          div.querySelectorAll('.thumb').forEach(function(t) { t.style.borderColor = '#ddd'; });
          thumb.style.borderColor = '#0EA5E9';
        };
      });

      var phoneBox = div.querySelector('#phone-box');
      if (phoneBox) {
        phoneBox.onclick = function() {
          var menu = div.querySelector('#phone-menu');
          menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        };
      }

      var chatBtn = div.querySelector('#btn-chat');
      if (chatBtn) {
        chatBtn.onclick = function() {
          fetch(API + '/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ sellerId: ad.userId, adId: ad.id })
          }).then(function(r) { return r.json(); })
            .then(function(chat) { navigate('chat-window', { chatId: chat.id, title: ad.title }); });
        };
      }

      var loginBtn = div.querySelector('#btn-login-chat');
      if (loginBtn) loginBtn.onclick = function() { navigate('login'); };

      var reportBtn = div.querySelector('#btn-report');
      if (reportBtn) reportBtn.onclick = function() { showReportModal(ad.id, token); };

      var deleteBtn = div.querySelector('#btn-delete-ad');
      if (deleteBtn) {
        deleteBtn.onclick = function() {
          if (!confirm('РЈРґР°Р»РёС‚СЊ СЌС‚Рѕ РѕР±СЉСЏРІР»РµРЅРёРµ?')) return;
          fetch(API + '/ads/' + ad.id, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
          }).then(function() { navigate('home'); });
        };
      }
    })
    .catch(function() { div.innerHTML = '<div class="empty">РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё</div>'; });
  return div;
}

function showReportModal(adId, token) {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = '<div class="modal">'
    + '<h3>&#128681; РџРѕР¶Р°Р»РѕРІР°С‚СЊСЃСЏ РЅР° РѕР±СЉСЏРІР»РµРЅРёРµ</h3>'
    + '<div class="form-group"><label>РџСЂРёС‡РёРЅР° Р¶Р°Р»РѕР±С‹</label>'
    + '<select id="report-reason">'
    + '<option value="spam">РЎРїР°Рј</option>'
    + '<option value="fraud">РњРѕС€РµРЅРЅРёС‡РµСЃС‚РІРѕ</option>'
    + '<option value="prohibited">Р—Р°РїСЂРµС‰С‘РЅРЅС‹Р№ С‚РѕРІР°СЂ</option>'
    + '<option value="wrong_category">РќРµРїСЂР°РІРёР»СЊРЅР°СЏ РєР°С‚РµРіРѕСЂРёСЏ</option>'
    + '<option value="other">Р”СЂСѓРіРѕРµ</option>'
    + '</select></div>'
    + '<div class="form-group"><label>РљРѕРјРјРµРЅС‚Р°СЂРёР№</label><textarea id="report-comment" rows="3" placeholder="РћРїРёС€РёС‚Рµ РїСЂРѕР±Р»РµРјСѓ..."></textarea></div>'
    + '<div style="display:flex;gap:10px;margin-top:8px">'
    + '<button class="btn btn-danger" id="btn-send-report" style="flex:1">РћС‚РїСЂР°РІРёС‚СЊ Р¶Р°Р»РѕР±Сѓ</button>'
    + '<button class="btn btn-outline" id="btn-cancel-report" style="flex:1;color:#333;border-color:#ddd">РћС‚РјРµРЅР°</button>'
    + '</div></div>';
  document.body.appendChild(overlay);
  overlay.querySelector('#btn-cancel-report').onclick = function() { document.body.removeChild(overlay); };
  overlay.onclick = function(e) { if (e.target === overlay) document.body.removeChild(overlay); };
  overlay.querySelector('#btn-send-report').onclick = function() {
    var reason = overlay.querySelector('#report-reason').value;
    var comment = overlay.querySelector('#report-comment').value;
    fetch(API + '/ads/' + adId + '/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ reason: reason + (comment ? ': ' + comment : '') })
    }).then(function() {
      document.body.removeChild(overlay);
      alert('Р–Р°Р»РѕР±Р° РѕС‚РїСЂР°РІР»РµРЅР°! РњРѕРґРµСЂР°С‚РѕСЂС‹ СЂР°СЃСЃРјРѕС‚СЂСЏС‚ РµС‘ РІ Р±Р»РёР¶Р°Р№С€РµРµ РІСЂРµРјСЏ.');
    }).catch(function() { alert('РћС€РёР±РєР° РѕС‚РїСЂР°РІРєРё'); });
  };
}

function renderChat() {
  var token = localStorage.getItem('token');
  if (!token) { navigate('login'); return document.createElement('div'); }
  var div = document.createElement('div');
  div.innerHTML = '<div class="chat-container"><h2 style="margin-bottom:24px;font-size:22px;font-weight:700">&#128172; РњРѕРё С‡Р°С‚С‹</h2><div id="chat-list"><div class="loading">Р—Р°РіСЂСѓР·РєР°...</div></div></div>';
  fetch(API + '/chat', { headers: { 'Authorization': 'Bearer ' + token } })
    .then(function(r) { return r.json(); })
    .then(function(chats) {
      var list = div.querySelector('#chat-list');
      if (!chats.length) { list.innerHTML = '<div class="empty">РЈ РІР°СЃ РїРѕРєР° РЅРµС‚ С‡Р°С‚РѕРІ.<br>РќР°РїРёС€РёС‚Рµ РїСЂРѕРґР°РІС†Сѓ СЃРѕ СЃС‚СЂР°РЅРёС†С‹ РѕР±СЉСЏРІР»РµРЅРёСЏ!</div>'; return; }
      list.innerHTML = '';
      chats.forEach(function(chat) {
        var item = document.createElement('div');
        item.className = 'chat-list-item';
        var title = chat.Ad ? chat.Ad.title : 'Р§Р°С‚ #' + chat.id;
        item.innerHTML = '<div class="chat-avatar">' + title.charAt(0).toUpperCase() + '</div>'
          + '<div style="flex:1"><div style="font-weight:600;font-size:15px">' + title + '</div>'
          + '<div style="font-size:13px;color:#888;margin-top:2px">РќР°Р¶РјРёС‚Рµ С‡С‚РѕР±С‹ РѕС‚РєСЂС‹С‚СЊ</div></div>'
          + '<div style="font-size:20px;color:#aaa">&#8594;</div>';
        item.onclick = function() { navigate('chat-window', { chatId: chat.id, title: title }); };
        list.appendChild(item);
      });
    })
    .catch(function() { div.querySelector('#chat-list').innerHTML = '<div class="empty">РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё С‡Р°С‚РѕРІ</div>'; });
  return div;
}

function renderChatWindow(chatId, title) {
  var token = localStorage.getItem('token');
  var user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!token) { navigate('login'); return document.createElement('div'); }
  var div = document.createElement('div');
  var intervalId = null;
  div.innerHTML = '<div class="chat-container">'
    + '<button class="btn btn-outline" id="btn-back-chat" style="margin-bottom:16px;color:#333;border-color:#ddd">&#8592; РќР°Р·Р°Рґ Рє С‡Р°С‚Р°Рј</button>'
    + '<div class="chat-window">'
    + '<div class="chat-header"><div class="chat-avatar" style="width:36px;height:36px;font-size:14px">' + (title || 'Р§').charAt(0).toUpperCase() + '</div>'
    + '<div style="margin-left:4px"><div style="font-weight:600">' + (title || 'Р§Р°С‚') + '</div></div></div>'
    + '<div class="chat-messages" id="messages"><div class="loading">Р—Р°РіСЂСѓР·РєР°...</div></div>'
    + '<div class="chat-input"><input type="text" id="msg-input" placeholder="РќР°РїРёСЃР°С‚СЊ СЃРѕРѕР±С‰РµРЅРёРµ..." />'
    + '<button class="btn btn-primary" id="btn-send">РћС‚РїСЂР°РІРёС‚СЊ</button></div>'
    + '</div></div>';

  div.querySelector('#btn-back-chat').onclick = function() {
    if (intervalId) clearInterval(intervalId);
    navigate('chat');
  };

  function loadMessages() {
    fetch(API + '/chat/' + chatId + '/messages', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(function(r) { return r.json(); })
      .then(function(messages) {
        var container = div.querySelector('#messages');
        if (!messages || !messages.length) {
          container.innerHTML = '<div class="empty" style="padding:20px">РќР°РїРёС€РёС‚Рµ РїРµСЂРІРѕРµ СЃРѕРѕР±С‰РµРЅРёРµ!</div>';
          return;
        }
        var wasAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 20;
        container.innerHTML = '';
        messages.forEach(function(msg) {
          var isMine = msg.senderId === user.id;
          var msgEl = document.createElement('div');
          msgEl.className = 'message ' + (isMine ? 'message-mine' : 'message-other');
          var time = new Date(msg.createdAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
          var text = msg.text || msg.content || '';
          var senderName = (!isMine && msg.Sender) ? '<div style="font-size:11px;font-weight:600;margin-bottom:3px;opacity:0.7">' + msg.Sender.name + '</div>' : '';
          msgEl.innerHTML = senderName + '<div>' + text + '</div><div class="message-time">' + time + '</div>';
          container.appendChild(msgEl);
        });
        if (wasAtBottom) container.scrollTop = container.scrollHeight;
      });
  }

  function sendMessage() {
    var input = div.querySelector('#msg-input');
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    fetch(API + '/chat/' + chatId + '/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ text: text })
    }).then(function() { loadMessages(); });
  }

  div.querySelector('#btn-send').onclick = sendMessage;
  div.querySelector('#msg-input').onkeydown = function(e) { if (e.key === 'Enter') sendMessage(); };

  loadMessages();
  intervalId = setInterval(loadMessages, 3000);
  return div;
}

function renderLogin() {
  var div = document.createElement('div');
  div.innerHTML = '<div class="form-container">'
    + '<h2>Р’РѕР№С‚Рё РІ Lekofy</h2>'
    + '<div class="form-group"><label>Email РёР»Рё С‚РµР»РµС„РѕРЅ</label><input type="text" id="login" placeholder="example@mail.com РёР»Рё +996..." /></div>'
    + '<div class="form-group"><label>РџР°СЂРѕР»СЊ</label><input type="password" id="password" placeholder="Р’Р°С€ РїР°СЂРѕР»СЊ" /></div>'
    + '<button class="btn btn-primary" id="btn-login" style="width:100%;margin-top:8px">Р’РѕР№С‚Рё</button>'
    + '<p class="form-error" id="error"></p>'
    + '<div class="form-link">РќРµС‚ Р°РєРєР°СѓРЅС‚Р°? <a id="to-reg">Р—Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊСЃСЏ</a></div>'
    + '</div>';
  div.querySelector('#to-reg').onclick = function() { navigate('register'); };
  div.querySelector('#btn-login').onclick = function() {
    var login = div.querySelector('#login').value;
    var password = div.querySelector('#password').value;
    var err = div.querySelector('#error');
    if (!login || !password) { err.textContent = 'Р—Р°РїРѕР»РЅРёС‚Рµ РІСЃРµ РїРѕР»СЏ'; return; }
    fetch(API + '/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: login, password: password })
    }).then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.error) { err.textContent = data.error; return; }
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('home');
      }).catch(function() { err.textContent = 'РћС€РёР±РєР° РїРѕРґРєР»СЋС‡РµРЅРёСЏ'; });
  };
  return div;
}
function renderRegister() {
  var strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  var div = document.createElement('div');
  div.innerHTML = '<div class="form-container">'
    + '<h2>Р РµРіРёСЃС‚СЂР°С†РёСЏ</h2>'
    + '<div class="form-group"><label>РРјСЏ</label><input type="text" id="name" placeholder="Р’Р°С€Рµ РёРјСЏ" /></div>'
    + '<div class="form-group"><label>РўРµР»РµС„РѕРЅ</label><input type="text" id="phone" placeholder="+996 700 000 000" /></div>'
    + '<div class="form-group"><label>РџР°СЂРѕР»СЊ</label><input type="password" id="password" placeholder="РњРёРЅ. 8 СЃРёРјРІРѕР»РѕРІ, Р·Р°РіР»Р°РІРЅР°СЏ, С†РёС„СЂР°, СЃРёРјРІРѕР»" /></div>'
    + '<div class="form-group"><label>РџРѕРІС‚РѕСЂРёС‚Рµ РїР°СЂРѕР»СЊ</label><input type="password" id="confirmPassword" placeholder="РџРѕРІС‚РѕСЂРёС‚Рµ РїР°СЂРѕР»СЊ" /></div>'
    + '<button class="btn btn-primary" id="btn-reg" style="width:100%;margin-top:8px">Р—Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊСЃСЏ</button>'
    + '<p class="form-error" id="error"></p>'
    + '<div class="form-link">РЈР¶Рµ РµСЃС‚СЊ Р°РєРєР°СѓРЅС‚? <a id="to-login">Р’РѕР№С‚Рё</a></div>'
    + '</div>';
  div.querySelector('#to-login').onclick = function() { navigate('login'); };
  div.querySelector('#btn-reg').onclick = function() {
    var name = div.querySelector('#name').value;
    var phone = div.querySelector('#phone').value;
    var password = div.querySelector('#password').value;
    var confirmPassword = div.querySelector('#confirmPassword').value;
    var err = div.querySelector('#error');
    if (!name || !phone || !password || !confirmPassword) { err.textContent = 'Р—Р°РїРѕР»РЅРёС‚Рµ РІСЃРµ РїРѕР»СЏ'; return; }
    if (password !== confirmPassword) { err.textContent = 'РџР°СЂРѕР»Рё РЅРµ СЃРѕРІРїР°РґР°СЋС‚'; return; }
    if (!strongPasswordRegex.test(password)) {
      err.textContent = 'РџР°СЂРѕР»СЊ: РјРёРЅРёРјСѓРј 8 СЃРёРјРІРѕР»РѕРІ, 1 Р·Р°РіР»Р°РІРЅР°СЏ, 1 С†РёС„СЂР° Рё 1 СЃРїРµС†СЃРёРјРІРѕР»';
      return;
    }
    fetch(API + '/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, phone: phone, password: password, confirmPassword: confirmPassword })
    }).then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.error) { err.textContent = data.error; return; }
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('home');
      }).catch(function() { err.textContent = 'РћС€РёР±РєР° РїРѕРґРєР»СЋС‡РµРЅРёСЏ'; });
  };
  return div;
}

function renderAdmin() {
  var token = localStorage.getItem('token');
  var user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!token || !user || (user.role !== 'admin' && user.role !== 'moderator')) {
    navigate('home'); return document.createElement('div');
  }
  var div = document.createElement('div');
  div.innerHTML = '<div class="admin-layout">'
    + '<div class="admin-sidebar"><h3>РњРµРЅСЋ</h3>'
    + '<div class="admin-menu-item active" data-s="stats">&#128202; РЎС‚Р°С‚РёСЃС‚РёРєР°</div>'
    + '<div class="admin-menu-item" data-s="moderation">&#9203; РњРѕРґРµСЂР°С†РёСЏ</div>'
    + '<div class="admin-menu-item" data-s="users">&#128101; РџРѕР»СЊР·РѕРІР°С‚РµР»Рё</div>'
    + '<div class="admin-menu-item" data-s="ads">&#128203; РћР±СЉСЏРІР»РµРЅРёСЏ</div>'
    + '<div class="admin-menu-item" data-s="reports">&#128680; Р–Р°Р»РѕР±С‹</div>'
    + '</div><div class="admin-main" id="admin-main"><div class="loading">Р—Р°РіСЂСѓР·РєР°...</div></div></div>';

  function getMain() { return div.querySelector('#admin-main'); }

  function loadStats() {
    getMain().innerHTML = '<div class="loading">Р—Р°РіСЂСѓР·РєР°...</div>';
    fetch(API + '/admin/stats', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(function(r) { return r.json(); })
      .then(function(s) {
        getMain().innerHTML = '<h2 style="margin-bottom:24px">РЎС‚Р°С‚РёСЃС‚РёРєР°</h2>'
          + '<div class="stats-grid">'
          + '<div class="stat-card"><div class="stat-number">' + s.totalUsers + '</div><div class="stat-label">РџРѕР»СЊР·РѕРІР°С‚РµР»РµР№</div></div>'
          + '<div class="stat-card"><div class="stat-number">' + s.totalAds + '</div><div class="stat-label">РћР±СЉСЏРІР»РµРЅРёР№</div></div>'
          + '<div class="stat-card"><div class="stat-number">' + s.activeAds + '</div><div class="stat-label">РђРєС‚РёРІРЅС‹С…</div></div>'
          + '<div class="stat-card"><div class="stat-number">' + (s.pendingAds || 0) + '</div><div class="stat-label">РќР° РјРѕРґРµСЂР°С†РёРё</div></div>'
          + '</div>';
      }).catch(function() { getMain().innerHTML = '<div class="empty">РћС€РёР±РєР°</div>'; });
  }

  function loadModeration() {
    getMain().innerHTML = '<div class="loading">Р—Р°РіСЂСѓР·РєР°...</div>';
    fetch(API + '/admin/ads/pending', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(function(r) { return r.json(); })
      .then(function(ads) {
        if (!ads.length) { getMain().innerHTML = '<h2 style="margin-bottom:24px">РњРѕРґРµСЂР°С†РёСЏ</h2><div class="empty">РќРµС‚ РѕР±СЉСЏРІР»РµРЅРёР№ РЅР° РјРѕРґРµСЂР°С†РёРё</div>'; return; }
        var rows = '';
        ads.forEach(function(ad) {
          rows += '<tr>'
            + '<td>' + ad.id + '</td>'
            + '<td><strong>' + ad.title + '</strong></td>'
            + '<td>' + Number(ad.price).toLocaleString() + ' СЃРѕРј</td>'
            + '<td>' + (ad.category || '-') + '</td>'
            + '<td><button class="btn btn-green btn-sm" style="margin-right:6px" data-id="' + ad.id + '" data-action="approve">РћРґРѕР±СЂРёС‚СЊ</button>'
            + '<button class="btn btn-danger btn-sm" data-id="' + ad.id + '" data-action="reject">РћС‚РєР»РѕРЅРёС‚СЊ</button></td></tr>';
        });
        getMain().innerHTML = '<h2 style="margin-bottom:24px">РќР° РјРѕРґРµСЂР°С†РёРё (' + ads.length + ')</h2>'
          + '<table class="table"><thead><tr><th>ID</th><th>РќР°Р·РІР°РЅРёРµ</th><th>Р¦РµРЅР°</th><th>РљР°С‚РµРіРѕСЂРёСЏ</th><th>Р”РµР№СЃС‚РІРёСЏ</th></tr></thead>'
          + '<tbody>' + rows + '</tbody></table>';
        getMain().querySelectorAll('button[data-id]').forEach(function(btn) {
          btn.onclick = function() {
            fetch(API + '/admin/ads/' + btn.getAttribute('data-id') + '/' + btn.getAttribute('data-action'), {
              method: 'PUT', headers: { 'Authorization': 'Bearer ' + token }
            }).then(function() { loadModeration(); });
          };
        });
      }).catch(function() { getMain().innerHTML = '<div class="empty">РћС€РёР±РєР°</div>'; });
  }

  function loadUsers() {
    getMain().innerHTML = '<div class="loading">Р—Р°РіСЂСѓР·РєР°...</div>';
    fetch(API + '/admin/users', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(function(r) { return r.json(); })
      .then(function(users) {
        var rows = '';
        users.forEach(function(u) {
          rows += '<tr><td>' + u.id + '</td><td>' + u.name + '</td><td>' + u.email + '</td>'
            + '<td><span class="badge badge-' + u.role + '">' + u.role + '</span></td>'
            + '<td><span class="badge ' + (u.isBlocked ? 'badge-blocked' : 'badge-active') + '">' + (u.isBlocked ? 'Р—Р°Р±Р»РѕРєРёСЂРѕРІР°РЅ' : 'РђРєС‚РёРІРµРЅ') + '</span></td>'
            + '<td><button class="btn ' + (u.isBlocked ? 'btn-green' : 'btn-danger') + ' btn-sm" data-id="' + u.id + '" data-blocked="' + u.isBlocked + '">'
            + (u.isBlocked ? 'Р Р°Р·Р±Р»РѕРєРёСЂРѕРІР°С‚СЊ' : 'Р—Р°Р±Р»РѕРєРёСЂРѕРІР°С‚СЊ') + '</button></td></tr>';
        });
        getMain().innerHTML = '<h2 style="margin-bottom:24px">РџРѕР»СЊР·РѕРІР°С‚РµР»Рё</h2>'
          + '<table class="table"><thead><tr><th>ID</th><th>РРјСЏ</th><th>Email</th><th>Р РѕР»СЊ</th><th>РЎС‚Р°С‚СѓСЃ</th><th>Р”РµР№СЃС‚РІРёРµ</th></tr></thead><tbody>' + rows + '</tbody></table>';
        getMain().querySelectorAll('button[data-id]').forEach(function(btn) {
          btn.onclick = function() {
            var action = btn.getAttribute('data-blocked') === 'true' ? 'unblock' : 'block';
            fetch(API + '/admin/users/' + btn.getAttribute('data-id') + '/' + action, {
              method: 'PUT', headers: { 'Authorization': 'Bearer ' + token }
            }).then(function(r) { return r.json(); })
              .then(function(data) { if (data.error) { alert(data.error); return; } loadUsers(); });
          };
        });
      }).catch(function() { getMain().innerHTML = '<div class="empty">РћС€РёР±РєР°</div>'; });
  }

  function loadAds() {
    getMain().innerHTML = '<div class="loading">Р—Р°РіСЂСѓР·РєР°...</div>';
    fetch(API + '/ads')
      .then(function(r) { return r.json(); })
      .then(function(ads) {
        var rows = '';
        ads.forEach(function(ad) {
          rows += '<tr><td>' + ad.id + '</td><td>' + ad.title + '</td><td>' + Number(ad.price).toLocaleString() + ' СЃРѕРј</td>'
            + '<td>' + (ad.category || '-') + '</td><td>' + ad.views + '</td>'
            + '<td><button class="btn btn-danger btn-sm" data-id="' + ad.id + '">РЈРґР°Р»РёС‚СЊ</button></td></tr>';
        });
        getMain().innerHTML = '<h2 style="margin-bottom:24px">РћР±СЉСЏРІР»РµРЅРёСЏ</h2>'
          + '<table class="table"><thead><tr><th>ID</th><th>РќР°Р·РІР°РЅРёРµ</th><th>Р¦РµРЅР°</th><th>РљР°С‚РµРіРѕСЂРёСЏ</th><th>РџСЂРѕСЃРјРѕС‚СЂС‹</th><th>Р”РµР№СЃС‚РІРёРµ</th></tr></thead><tbody>' + rows + '</tbody></table>';
        getMain().querySelectorAll('button[data-id]').forEach(function(btn) {
          btn.onclick = function() {
            if (!confirm('РЈРґР°Р»РёС‚СЊ?')) return;
            fetch(API + '/ads/' + btn.getAttribute('data-id'), {
              method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token }
            }).then(function() { loadAds(); });
          };
        });
      }).catch(function() { getMain().innerHTML = '<div class="empty">РћС€РёР±РєР°</div>'; });
  }

  function loadReports() {
    getMain().innerHTML = '<div class="loading">Р—Р°РіСЂСѓР·РєР°...</div>';
    fetch(API + '/admin/reports', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(function(r) { return r.json(); })
      .then(function(reports) {
        if (!reports.length) { getMain().innerHTML = '<h2 style="margin-bottom:24px">Р–Р°Р»РѕР±С‹</h2><div class="empty">Р–Р°Р»РѕР± РЅРµС‚ вњ…</div>'; return; }
        var rows = '';
        reports.forEach(function(r) {
          var reporterName = r.Reporter
            ? r.Reporter.name + '<br><span style="font-size:11px;color:#888">' + r.Reporter.email + '</span>'
            : 'ID ' + r.reporterId;
          var adCell = r.Ad
            ? '<div style="font-weight:600;color:#0EA5E9;cursor:pointer" data-adid="' + r.Ad.id + '">' + r.Ad.title + '</div>'
              + '<div style="font-size:11px;color:#888;margin-top:2px">ID: ' + r.Ad.id + '</div>'
              + '<button class="btn btn-primary btn-sm open-ad-btn" data-adid="' + r.Ad.id + '" style="margin-top:6px;font-size:11px">РћС‚РєСЂС‹С‚СЊ в†’</button>'
            : ('РћР±СЉСЏРІР»РµРЅРёРµ #' + (r.adId || 'вЂ”'));
          var statusBadge = r.status === 'resolved'
            ? '<span class="badge badge-active">Р РµС€РµРЅР°</span>'
            : r.status === 'rejected'
            ? '<span class="badge badge-rejected">РћС‚РєР»РѕРЅРµРЅР°</span>'
            : '<span class="badge badge-pending">РћР¶РёРґР°РµС‚</span>';
          rows += '<tr><td>' + r.id + '</td><td>' + reporterName + '</td><td>' + adCell + '</td>'
            + '<td style="max-width:180px">' + r.reason + '</td><td>' + statusBadge + '</td>'
            + '<td>' + (r.status === 'pending'
              ? '<button class="btn btn-green btn-sm" style="margin-right:4px;margin-bottom:4px" data-id="' + r.id + '" data-status="resolved">Р РµС€РёС‚СЊ</button>'
              + '<button class="btn btn-danger btn-sm" data-id="' + r.id + '" data-status="rejected">РћС‚РєР»РѕРЅРёС‚СЊ</button>'
              : 'вЂ”') + '</td></tr>';
        });
        getMain().innerHTML = '<h2 style="margin-bottom:24px">Р–Р°Р»РѕР±С‹ (' + reports.length + ')</h2>'
          + '<table class="table"><thead><tr><th>ID</th><th>РћС‚ РєРѕРіРѕ</th><th>РћР±СЉСЏРІР»РµРЅРёРµ</th><th>РџСЂРёС‡РёРЅР°</th><th>РЎС‚Р°С‚СѓСЃ</th><th>Р”РµР№СЃС‚РІРёРµ</th></tr></thead>'
          + '<tbody>' + rows + '</tbody></table>';
        getMain().querySelectorAll('button[data-id]').forEach(function(btn) {
          btn.onclick = function() {
            fetch(API + '/admin/reports/' + btn.getAttribute('data-id'), {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
              body: JSON.stringify({ status: btn.getAttribute('data-status') })
            }).then(function() { loadReports(); });
          };
        });
        getMain().querySelectorAll('.open-ad-btn, [data-adid]').forEach(function(el) {
          el.onclick = function(e) { e.stopPropagation(); navigate('ad-detail', { id: el.getAttribute('data-adid') }); };
        });
      }).catch(function() { getMain().innerHTML = '<div class="empty">РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё Р¶Р°Р»РѕР±</div>'; });
  }

  div.querySelectorAll('.admin-menu-item').forEach(function(item) {
    item.onclick = function() {
      div.querySelectorAll('.admin-menu-item').forEach(function(i) { i.classList.remove('active'); });
      item.classList.add('active');
      var s = item.getAttribute('data-s');
      if (s === 'stats') loadStats();
      else if (s === 'moderation') loadModeration();
      else if (s === 'users') loadUsers();
      else if (s === 'ads') loadAds();
      else if (s === 'reports') loadReports();
    };
  });

  loadStats();
  return div;
}

function renderCreateAd() {
  var token = localStorage.getItem('token');
  if (!token) { navigate('login'); return document.createElement('div'); }
  var div = document.createElement('div');
  var selectedFiles = [];
  div.innerHTML = '<div class="create-form">'
    + '<button class="btn btn-outline" id="btn-back" style="margin-bottom:16px;color:#333;border-color:#ddd">&#8592; РќР°Р·Р°Рґ</button>'
    + '<h2>РџРѕРґР°С‚СЊ РѕР±СЉСЏРІР»РµРЅРёРµ</h2>'
    + '<div style="background:#fff3e0;border-radius:10px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#e65100">&#9203; РћР±СЉСЏРІР»РµРЅРёРµ РїРѕСЏРІРёС‚СЃСЏ РїРѕСЃР»Рµ РїСЂРѕРІРµСЂРєРё РјРѕРґРµСЂР°С‚РѕСЂРѕРј</div>'
    + '<div class="form-group"><label>РќР°Р·РІР°РЅРёРµ *</label><input type="text" id="title" placeholder="РќР°РїСЂРёРјРµСЂ: iPhone 14 Pro" /></div>'
    + '<div class="form-group"><label>РћРїРёСЃР°РЅРёРµ</label><textarea id="description" rows="4" placeholder="РћРїРёС€РёС‚Рµ С‚РѕРІР°СЂ РїРѕРґСЂРѕР±РЅРµРµ..."></textarea></div>'
    + '<div class="form-group"><label>Р¦РµРЅР° (СЃРѕРј) *</label><input type="number" id="price" placeholder="0" /></div>'
    + '<div class="form-group"><label>РќРѕРјРµСЂ С‚РµР»РµС„РѕРЅР°</label><input type="text" id="phone" placeholder="+996 700 000 000" /></div>'
    + '<div class="form-group"><label>РљР°С‚РµРіРѕСЂРёСЏ</label><select id="category">'
    + '<option value="">Р’С‹Р±РµСЂРёС‚Рµ РєР°С‚РµРіРѕСЂРёСЋ</option>'
    + '<option value="electronics">Р­Р»РµРєС‚СЂРѕРЅРёРєР°</option>'
    + '<option value="transport">РўСЂР°РЅСЃРїРѕСЂС‚</option>'
    + '<option value="realty">РќРµРґРІРёР¶РёРјРѕСЃС‚СЊ</option>'
    + '<option value="clothes">РћРґРµР¶РґР°</option>'
    + '<option value="furniture">РњРµР±РµР»СЊ</option>'
    + '<option value="jobs">Р Р°Р±РѕС‚Р°</option>'
    + '<option value="services">РЈСЃР»СѓРіРё</option>'
    + '<option value="other">Р”СЂСѓРіРѕРµ</option>'
    + '</select></div>'
    + '<div class="form-group"><label>Р“РѕСЂРѕРґ</label><input type="text" id="city" placeholder="Р‘РёС€РєРµРє" /></div>'
    + '<div class="form-group"><label>Р¤РѕС‚Рѕ (РґРѕ 5 С€С‚СѓРє)</label>'
    + '<div class="upload-area" id="upload-area">&#128247; РќР°Р¶РјРёС‚Рµ С‡С‚РѕР±С‹ РІС‹Р±СЂР°С‚СЊ С„РѕС‚Рѕ</div>'
    + '<input type="file" id="file-input" multiple accept="image/*" style="display:none" />'
    + '<div class="preview-images" id="preview"></div></div>'
    + '<button class="btn btn-primary" id="btn-submit" style="width:100%;padding:16px;font-size:16px;margin-top:8px">РћС‚РїСЂР°РІРёС‚СЊ РЅР° РјРѕРґРµСЂР°С†РёСЋ</button>'
    + '<p class="form-error" id="error"></p>'
    + '</div>';

  div.querySelector('#btn-back').onclick = function() { navigate('home'); };
  div.querySelector('#upload-area').onclick = function() { div.querySelector('#file-input').click(); };
  div.querySelector('#file-input').onchange = function(e) {
    var picked = Array.from(e.target.files || []);
    if (!picked.length) return;

    // РџРѕР·РІРѕР»СЏРµС‚ РІС‹Р±РёСЂР°С‚СЊ С‚Рµ Р¶Рµ С„Р°Р№Р»С‹ РїРѕРІС‚РѕСЂРЅРѕ.
    e.target.value = '';

    // Р”РѕР±Р°РІР»СЏРµРј РЅРѕРІС‹Рµ С„Р°Р№Р»С‹ Рє С‚РµРєСѓС‰РµРјСѓ СЃРїРёСЃРєСѓ, Р±РµР· РґСѓР±Р»РµР№.
    var existing = {};
    selectedFiles.forEach(function(file) {
      existing[file.name + '_' + file.size + '_' + file.lastModified] = true;
    });
    picked.forEach(function(file) {
      var key = file.name + '_' + file.size + '_' + file.lastModified;
      if (!existing[key]) {
        selectedFiles.push(file);
        existing[key] = true;
      }
    });

    // Р’ СЌС‚РѕР№ С„РѕСЂРјРµ Р»РёРјРёС‚ 5 С„РѕС‚Рѕ.
    if (selectedFiles.length > 5) {
      selectedFiles = selectedFiles.slice(0, 5);
    }

    var preview = div.querySelector('#preview');
    preview.innerHTML = '';
    selectedFiles.forEach(function(file) {
      var reader = new FileReader();
      reader.onload = function(ev) {
        var img = document.createElement('img');
        img.src = ev.target.result;
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
    div.querySelector('#upload-area').textContent = selectedFiles.length + ' С„РѕС‚Рѕ РІС‹Р±СЂР°РЅРѕ';
  };

  div.querySelector('#btn-submit').onclick = async function() {
    var title = div.querySelector('#title').value;
    var description = div.querySelector('#description').value;
    var price = div.querySelector('#price').value;
    var phone = div.querySelector('#phone').value;
    var category = div.querySelector('#category').value;
    var city = div.querySelector('#city').value;
    var err = div.querySelector('#error');
    if (!title || !price) { err.textContent = 'Р—Р°РїРѕР»РЅРёС‚Рµ РЅР°Р·РІР°РЅРёРµ Рё С†РµРЅСѓ'; return; }
    var btn = div.querySelector('#btn-submit');
    btn.textContent = 'РћС‚РїСЂР°РІРєР°...';
    btn.disabled = true;
    try {
      var formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('phone', phone);
      formData.append('category', category);
      formData.append('city', city);
      selectedFiles.forEach(function(file) { formData.append('images', file); });
      var res = await fetch(API + '/ads', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData
      });
      var data = await res.json();
      if (data.error) throw new Error(data.error);
      alert('РћР±СЉСЏРІР»РµРЅРёРµ РѕС‚РїСЂР°РІР»РµРЅРѕ РЅР° РјРѕРґРµСЂР°С†РёСЋ! РћРЅРѕ РїРѕСЏРІРёС‚СЃСЏ РїРѕСЃР»Рµ РїСЂРѕРІРµСЂРєРё.');
      navigate('home');
    } catch(e) {
      err.textContent = e.message || 'РћС€РёР±РєР° РїСѓР±Р»РёРєР°С†РёРё';
      btn.textContent = 'РћС‚РїСЂР°РІРёС‚СЊ РЅР° РјРѕРґРµСЂР°С†РёСЋ';
      btn.disabled = false;
    }
  };
  return div;
}

function showToast(text, duration) {
  duration = duration || 3500;
  var t = document.createElement('div');
  t.className = 'toast';
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, duration);
}

function renderProfile(userId) {
  var div = document.createElement('div');
  var currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  div.innerHTML = '<div class="loading">Р—Р°РіСЂСѓР·РєР° РїСЂРѕС„РёР»СЏ...</div>';
  fetch(API + '/auth/profile/' + userId)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) { div.innerHTML = '<div class="empty">РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ РЅР°Р№РґРµРЅ</div>'; return; }
      var u = data.user;
      var ads = data.ads || [];
      var isSelf = currentUser && currentUser.id === u.id;
      var joinDate = new Date(u.createdAt).toLocaleDateString('ru', { year: 'numeric', month: 'long' });
      var adsHtml = '';
      if (ads.length) {
        ads.forEach(function(ad) {
          adsHtml += '<div class="ad-card" data-id="' + ad.id + '">'
            + (ad.images && ad.images.length ? '<img src="' + ad.images[0] + '" />' : '<div class="ad-card-no-img">&#127991;</div>')
            + '<div class="ad-card-body"><div class="ad-card-title">' + ad.title + '</div>'
            + '<div class="ad-card-price">' + Number(ad.price).toLocaleString() + ' СЃРѕРј</div>'
            + '<div class="ad-card-meta"><span>&#128205; ' + (ad.city || 'вЂ”') + '</span><span>&#128065; ' + (ad.views || 0) + '</span></div>'
            + '</div></div>';
        });
      } else {
        adsHtml = '<div class="empty" style="padding:40px">РќРµС‚ Р°РєС‚РёРІРЅС‹С… РѕР±СЉСЏРІР»РµРЅРёР№</div>';
      }
      var avatarHtml = u.avatar
        ? '<img src=\"' + u.avatar + '\" style=\"width:80px;height:80px;border-radius:50%;object-fit:cover;flex-shrink:0\" />'
        : '<div style=\"width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#05E0A0,#0EA5E9);display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:white;flex-shrink:0\">' + u.name.charAt(0).toUpperCase() + '</div>';

      div.innerHTML = '<div style="max-width:800px;margin:0 auto">'
        + '<button class="btn btn-outline" id="btn-back-profile" style="margin-bottom:20px;color:#333;border-color:#ddd">&#8592; РќР°Р·Р°Рґ</button>'
        + '<div style="background:white;border-radius:20px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.08);margin-bottom:24px;display:flex;align-items:flex-start;gap:24px;flex-wrap:wrap">'
        + avatarHtml
        + '<div style="flex:1;min-width:220px"><div style="font-size:24px;font-weight:700;margin-bottom:6px">' + u.name + '</div>'
        + '<div style="font-size:13px;color:#888;margin-bottom:4px">&#128197; РќР° Lekofy СЃ ' + joinDate + '</div>'
        + '<div style="font-size:13px;color:#888;margin-bottom:8px">&#128203; РћР±СЉСЏРІР»РµРЅРёР№: ' + ads.length + '</div>'
        + (u.bio ? '<div style="font-size:14px;color:#444;white-space:pre-line;margin-top:4px">' + u.bio + '</div>' : '')
        + (isSelf ? '<div style="margin-top:12px"><button class="btn btn-primary btn-sm" id="btn-edit-profile">Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ РїСЂРѕС„РёР»СЊ</button></div>' : '')
        + '</div></div>'
        + '<h3 style="font-size:18px;font-weight:700;margin-bottom:16px">РћР±СЉСЏРІР»РµРЅРёСЏ РїСЂРѕРґР°РІС†Р°</h3>'
        + '<div class="ads-grid">' + adsHtml + '</div></div>';
      div.querySelector('#btn-back-profile').onclick = function() { navigate('home'); };
      if (isSelf) {
        var editBtn = div.querySelector('#btn-edit-profile');
        if (editBtn) {
          editBtn.onclick = function() {
            var overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = '<div class="modal">'
              + '<h3>Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ РїСЂРѕС„РёР»СЊ</h3>'
              + '<div class="form-group"><label>РРјСЏ</label><input type="text" id="prof-name" value="' + (u.name || '') + '"/></div>'
              + '<div class="form-group"><label>РўРµР»РµС„РѕРЅ</label><input type="text" id="prof-phone" value="' + (u.phone || '') + '"/></div>'
              + '<div class="form-group"><label>РћРїРёСЃР°РЅРёРµ</label><textarea id="prof-bio" rows="3" placeholder="Р Р°СЃСЃРєР°Р¶РёС‚Рµ Рѕ СЃРµР±Рµ...">' + (u.bio || '') + '</textarea></div>'
              + '<div class="form-group"><label>РђРІР°С‚Р°СЂ</label><input type="file" id="prof-avatar" accept="image/*" /></div>'
              + '<div style="display:flex;gap:10px;margin-top:8px">'
              + '<button class="btn btn-primary" id="btn-save-prof" style="flex:1">РЎРѕС…СЂР°РЅРёС‚СЊ</button>'
              + '<button class="btn btn-outline" id="btn-cancel-prof" style="flex:1;color:#333;border-color:#ddd">РћС‚РјРµРЅР°</button>'
              + '</div></div>';
            document.body.appendChild(overlay);
            overlay.onclick = function(e) { if (e.target === overlay) document.body.removeChild(overlay); };
            overlay.querySelector('#btn-cancel-prof').onclick = function() { document.body.removeChild(overlay); };
            overlay.querySelector('#btn-save-prof').onclick = function() {
              var token = localStorage.getItem('token');
              if (!token) { navigate('login'); return; }
              var nameVal = overlay.querySelector('#prof-name').value;
              var phoneVal = overlay.querySelector('#prof-phone').value;
              var bioVal = overlay.querySelector('#prof-bio').value;
              var fileInput = overlay.querySelector('#prof-avatar');
              var fd = new FormData();
              fd.append('name', nameVal);
              fd.append('phone', phoneVal);
              fd.append('bio', bioVal);
              if (fileInput.files && fileInput.files[0]) {
                fd.append('avatar', fileInput.files[0]);
              }
              fetch(API + '/auth/me', {
                method: 'PUT',
                headers: { 'Authorization': 'Bearer ' + token },
                body: fd
              }).then(function(r) { return r.json(); })
                .then(function(resp) {
                  if (resp.error) { alert(resp.error); return; }
                  localStorage.setItem('user', JSON.stringify({ id: resp.id, name: resp.name, email: resp.email, role: resp.role }));
                  document.body.removeChild(overlay);
                  navigate('profile', { userId: resp.id });
                })
                .catch(function() { alert('РћС€РёР±РєР° СЃРѕС…СЂР°РЅРµРЅРёСЏ РїСЂРѕС„РёР»СЏ'); });
            };
          };
        }
      }
      div.querySelectorAll('[data-id]').forEach(function(card) {
        card.onclick = function() { navigate('ad-detail', { id: card.getAttribute('data-id') }); };
      });
    })
    .catch(function() { div.innerHTML = '<div class="empty">РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РїСЂРѕС„РёР»СЏ</div>'; });
  return div;
}

navigate('home');

