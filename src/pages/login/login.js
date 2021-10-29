// toggle tab page
$('.tab-nav li a').on('click tap', function(e) {
    $(this).parent().addClass('active')
    $(this).parent().siblings().removeClass('active')
    $(e.target.hash).addClass('active')
    setTimeout( function () {$(e.target.hash).addClass('in')} , 100)
    $(e.target.hash).siblings().removeClass('active in')
})

// api url
const apiUrl = 'https://www.something.com/api'

// login
$('#login .loginBtn.btn').on('click', function(e){
    var formObject = {};
    var formArray =$("#loginForm").serializeArray();

    $.each(formArray,function(i,item){
        formObject[item.name] = item.value;
    });

    if(formObject.UserName === '' || formObject.Password === '') {
        $('#login p.tips.inputError').removeClass('d-none')
        return
    } else {
        $('#login p.tips.inputError').addClass('d-none')
    }
    $.ajax({
        type: "POST",
        dataType: "json",
        url: apiUrl + "/user/login" ,
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(formObject),
        timeout: 3000,
        success: function (res) {
            $('#login p.tips.serveError').addClass('d-none')
            if (res.code === 1) {
                localStorage.setItem('UserName', formObject.UserName)
                window.location.href = './index.html'
            } else {
                $('#login p.tips.throwError').text('*' + res.message).removeClass('d-none')
            }
        },
        error: function(res) {
            $('#login p.tips.serveError').removeClass('d-none')
        }
    })
})

// sign up
$('#signup .signupBtn.btn').on('click', function(e){
    var formObject = {};
    var formArray =$("#signupForm").serializeArray();
    $.each(formArray,function(i,item){
        formObject[item.name] = item.value;
    });
    if(formObject.UserName === '' && formObject.Password === '' && formObject.Password1 === '') {
        $('#signup p.tips.inputError').removeClass('d-none')
        return
    } else if(formObject.UserName === '') {
        $('#signup p.tips.userError').removeClass('d-none')
        return
    } else if(formObject.Password1 === '') {
        $('#signup p.tips.passwordError').removeClass('d-none')
        return
    } else if(formObject.Password !== formObject.Password1) {
        $('#signup p.tips.repeatError').removeClass('d-none')
        return
    } else {
        $('#signup p.tips').addClass('d-none')
    }
    $.ajax({
        type: "POST",
        dataType: "json",
        url: apiUrl + "/user/signup" ,
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(formObject),
        timeout: 3000,
        success: function (res) {
            $('#login p.tips.serveError').addClass('d-none')
            if (res.code === 1) {
                alert('Success! login now!')
                window.location.reload()
            } else {
                $('#signup p.tips.throwError').text('*' + res.message).removeClass('d-none')
            }
        },
        error: function() {
            $('#signup p.tips.serveError').removeClass('d-none')
        }
    })
})
