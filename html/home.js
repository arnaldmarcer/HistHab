$(document).ready(function() {
  $.ajax({
    type: "GET",
    url: "../env/apps.json",
    success: function(data) {
      buildPage(data);
    },
    error: function(errormessage) {
      alert("Could not read validation json data file!")
    }
  });
});

function buildPage(data) {
  for (var i = 0; i < data.length; i++) {
    app = data[i];
    item = "<a class='tablinks' href='#' onclick=\"openTab(event, '" + app['application'] + "')\">" + app['name'] + "</a>"
    $(".dropdown-content").append(item);
    // alert(item);
    app_tab = "<div id='" + app['application'] + "' class='tabcontent'>"
    app_tab = app_tab + "<iframe src='" + app['url'] + "'></iframe>"
    app_tab = app_tab + "</div>"
    // alert(app_tab);
    $("#application_tabs").append(app_tab);
  }
}

function openTab(evt, tabName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}
