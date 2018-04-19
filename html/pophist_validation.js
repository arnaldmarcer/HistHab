var dir_results = "";
var dir_orthos = "";
var f_accuracy_sample = "";
var orthoMetadata = null;
var grid_list = [];
var regionFiles = [];
var regionPopInfo = [];
var xc = 500;
var yc = 500;
var grid_square_size_meters = 100;
var image_resolution = 2; //meters per pixel
var sample_radius_size_meters = 500;
var population_location_radius_meters = 20;
var grid_square_colour = '#00FEFF';
var selected_grid_square_colour = '#ffff00';
var sample_circle_colour = 'red';
var image_pixel_size = 1000;
var canvas_pixel_size = 600;
var selected_lc_type = "";
var time_line = [];
var selected_square = null;
var user_name = ""
var user_ip = ""
var validation_data = [];
var time_options = {
  timeZone: 'Europe/Madrid',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric'
};
var selected_row = null;
$(document).ready(function() {
  $.ajax({
    type: "GET",
    url: "../env/config.json",
    success: function(data) {
      dir_orthos = data['dir_orthos'];
      dir_results = data['dir_results'] + "/";
      readValidationData();
      initApplication();

    },
    error: function(errormessage) {
      alert("Could not read configuration file!")
    }
  });

});

function initApplication() {
  $('img').click(function() {
    $('.selected').removeClass('selected');
    $(this).addClass('selected');
    selected_lc_type = $(this).attr('id');
    if (selected_lc_type == "blank") {
      selected_lc_type = "";
    }
    selected_row.data().label_check = selected_lc_type;
    drawImageForValidation();
    updateLabelOnValidationData(selected_lc_type);
    $('#validation_sample_table').DataTable().ajax.reload();
  });
}

function readValidationData() {
  user_name = $('#user_name').val();
  user_ip = $('#user_ip').val();

  f_accuracy_sample = dir_results + user_name + "_accuracy_assessment_sample.json";
  // alert(f_accuracy_sample);
  $.ajax({
    type: "GET",
    url: f_accuracy_sample,
    success: function(data) {
      validation_data = data;
      buildValidationTable();
    },
    error: function(errormessage) {
      alert("Could not read validation json data file!")
    }
  });
}

function updateLabelOnValidationData(label) {
  // alert(selected_row.data().id);
  for (var i = 0; i < validation_data.length; i++) {
    if (validation_data[i].acronym == selected_row.data().acronym &&
      validation_data[i].year == selected_row.data().year &&
      validation_data[i].id == selected_row.data().id) {
      validation_data[i].label_check = label;
      validation_data[i].timestamp_check = (new Date()).toLocaleString('en-GB', time_options);
      // alert(validation_data[i].timestamp_check);
    }
  }
}

function buildValidationTable() {
  $.extend(true, $.fn.dataTable.defaults, {
    "paging": false,
    // "pageLength": 25,
    // "lengthChange": false,
    "scrollY": 820,
    "scrollCollapse": true,
    "searching": false
  });
  $('#validation_sample_table').DataTable({
    "lengthMenu": [
      [25],
      [25]
    ],
    ajax: function(data, callback, settings) {
      callback({
        data: validation_data
      }) //reloads data
    },
    "columns": [{
        "data": "region"
      },
      {
        "data": "acronym"
      },
      {
        "data": "year"
      },
      {
        "data": "label_check"
      }
    ]
  });
  var table = $('#validation_sample_table').DataTable();
  $('#validation_sample_table tbody').on('click', 'tr', function() {
    if ($(this).hasClass('selected')) {
      $(this).removeClass('selected');
    } else {
      table.$('tr.selected').removeClass('selected');
      $(this).addClass('selected');
    }
    selected_row = table.row('.selected');
    // alert(selected_row.data().label_check);
    drawImageForValidation();
  });

  $('#button').click(function() {
    table.row('.selected').remove().draw(false);
  });

}

function drawImageForValidation() {
  data = selected_row.data();
  readOrthoMetadata(data.region, data.acronym, data.year, data.resolution);
  generateGrid();
  var c = document.getElementById("canvas");
  var ctx = c.getContext("2d");
  c.width = canvas_pixel_size;
  c.height = canvas_pixel_size;
  ctx.clearRect(0, 0, c.width, c.height);
  // alert(dir_orthos + region + "/" + acronym + "\_ortho_" + year + "_r" + resolution + "_2km.jpg");
  var image = new Image();
  image.onload = function() {
    ux = Math.round((image_pixel_size - canvas_pixel_size) / 2);
    uy = Math.round((image_pixel_size - canvas_pixel_size) / 2);
    ctx.drawImage(image, ux, uy, canvas_pixel_size, canvas_pixel_size, 0, 0, canvas_pixel_size, canvas_pixel_size);
    drawGridForValidation(data.pop_xc, data.pop_yc, data.xc, data.yc);
    // Since we store coordinates as related to the whole 2km image, we need to adjust
    sq_xc = data.xc - (image_pixel_size - canvas_pixel_size) / 2
    sq_yc = data.yc - (image_pixel_size - canvas_pixel_size) / 2
    drawGridSquare(sq_xc, sq_yc, data.xs, data.ys, selected_grid_square_colour, 2);
    drawSquareLabel(sq_xc, sq_yc, data.xs, data.ys, data.label_check);
  }
  image.src = dir_orthos + data.region + "/" + data.acronym + "\_ortho_" + data.year + "_r" + data.resolution + "_2km.jpg";
}

function drawSquareLabel(sq_xc, sq_yc, sq_xs, sq_ys, label) {
  var c = document.getElementById("canvas");
  var context = c.getContext("2d");
  context.font = "16px 'Courier New', courier, monospace";
  context.strokeStyle = selected_grid_square_colour;
  context.lineWidth = 1;
  context.strokeText(label, sq_xc + sq_xs / 2 - 8, sq_yc + sq_ys / 2 + 5);
}

function drawGridForValidation(pop_xc, pop_yc, sq_xc, sq_yc) {

  drawCircle(pop_xc, pop_yc);
  generateGrid();
  for (var i = 0; i < grid_list.length; i++) {
    grid_square = grid_list[i];
    x_center = Math.round(parseInt(grid_square.xc) + parseInt(grid_square.xs) / 2)
    y_center = Math.round(parseInt(grid_square.yc) + parseInt(grid_square.ys) / 2)
    drawGridSquare(grid_square.xc, grid_square.yc, grid_square.xs, grid_square.ys, grid_square_colour, 2);
  }
}

function readOrthoMetadata(region, acronym, year, resolution) {
  url = dir_orthos + region + "/" + acronym + "_ortho_" + year + "_r" + resolution + "_2km.json";
  $.ajax({
    type: "GET",
    url: url,
    success: function(data) {
      // alert(url),
      orthoMetadata = data;
      // alert(JSON.stringify(data));

      metadataToHTML();

    },
    error: function(errormessage) {
      alert("Could not read ortho metadata!")
    }
  });
}

function drawCircle(pop_xc, pop_yc) {
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  // Big circle
  context.beginPath();
  xc = pop_xc - (image_pixel_size - canvas_pixel_size) / 2
  yc = pop_yc - (image_pixel_size - canvas_pixel_size) / 2
  context.arc(xc, yc, Math.round(sample_radius_size_meters / image_resolution), 0, 2 * Math.PI);
  context.strokeStyle = sample_circle_colour;
  context.lineWidth = 2;
  context.setLineDash([16]);
  context.stroke();
  context.closePath();
  // Small drawCircle
  context.beginPath();
  xc = pop_xc - (image_pixel_size - canvas_pixel_size) / 2
  yc = pop_yc - (image_pixel_size - canvas_pixel_size) / 2
  context.arc(xc, yc, Math.round(20 / image_resolution), 0, 2 * Math.PI);
  context.strokeStyle = sample_circle_colour;
  context.lineWidth = 2;
  context.setLineDash([0]);
  context.stroke();
  context.closePath();
}

function generateGrid() { //JSON version
  grid_list = [];
  grid_number = 1;
  npx_radius = Math.round(sample_radius_size_meters / image_resolution);
  step = Math.round(grid_square_size_meters / image_resolution);
  half_step = Math.round(step / 2);
  for (var y = yc - npx_radius; y <= yc + npx_radius; y = y + step) {
    for (var x = xc - npx_radius; x <= xc + npx_radius; x = x + step) {
      gsq_center_x = x + half_step;
      gsq_center_y = y + half_step;
      sq_distance_to_population = Math.pow(gsq_center_x - xc, 2) + Math.pow(gsq_center_y - yc, 2);
      if (sq_distance_to_population > Math.pow(npx_radius, 2)) {
        continue;
      }
      grid_square = [grid_number, x, y, step, step, ""];
      grid_square = new GridSquare(grid_number, x, y, step, step, "")
      grid_list.push(grid_square);
      grid_number = grid_number + 1;
    }
  }
  selected_square = grid_list[0];
}

function getLCcolor(lc) {
  color = "#474749"
  lc = lc.charAt(0)
  switch (lc) {
    case "F":
      color = "#66ff66";
      break;
    case "D":
      color = "#ffe066";
      break;
    case "S":
      color = "#8A2BE2";
      break;
    case "A":
      color = "yellow";
      break;
    case "B":
      color = "#ff99ff";
      break;
    case "U":
      color = "red";
      break;
    case "I":
      color = "red";
      break;
    case "W":
      color = "#80bfff";
      break;
  }
  return (color);
}

function getPopulationImagesMetadata() {
  var acronym = $("#acronym :selected").val();
  acronym = acronym.split(" - ")[0].toLowerCase();
  pop_image_data = [];
  for (var i = 0; i < regionPopInfo.length; i++) {
    if (regionPopInfo[i][0] == acronym) {
      pop_image_data.push(regionPopInfo[i])
    }
  }
  return (pop_image_data);
}

function GridSquare(id, xc, yc, sx, sy, label) {
  a = {};
  a.id = id;
  a.xc = xc;
  a.yc = yc;
  a.xs = sx;
  a.ys = sy;
  a.label = label;
  a.timestamp = (new Date()).toLocaleString('en-GB', time_options);
  return a;
}

function drawGridSquare(xc, yc, xs, ys, color, width) {
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  context.beginPath();
  context.globalAlpha = 1.0;
  context.rect(xc, yc, xs, ys);
  // alert("drawGridSquare: " + xc + "," + yc);
  context.lineWidth = width;
  context.strokeStyle = color;
  context.closePath();
  context.stroke();
}

function PopulationMetadata(dwlt, year, wmsurl, epsg, layer, file, acr, reg,
  long, lat, opxsz, res) {
  pm = {};
  pm.download_time = dwlt;
  pm.acronym = acr;
  pm.year = year;
  pm.region = reg;
  pm.epsg = epsg;
  pm.wms_url = wmsurl;
  pm.layer = layer;
  pm.file = file;
  pm.long = long;
  pm.lat = lat;
  pm.ortho_px_size = opxsz;
  pm.resolution = res;
  return (pm);
}

function txtMetadataToJSON(md) {
  md = md.split("\n");
  pm = new PopulationMetadata(md[1].split("=")[1], md[3].split("=")[1], md[4].split("=")[1],
    md[5].split("=")[1], md[7].split("=")[1], md[8].split("=")[1],
    md[11].split("=")[1], md[12].split("=")[1], md[13].split("=")[1],
    md[14].split("=")[1], md[17].split("=")[1], 2);
  return (pm);
}

function metadataToHTML() {
  long = Math.round(orthoMetadata["long_epsg4326"] * 1000000) / 1000000
  lat = Math.round(orthoMetadata["lat_epsg4326"] * 1000000) / 1000000
  $('#metadata_text').empty();
  $("#metadata_text").append("<p><span class='metadata_label'>Population</span><span class='metadata_value'>" + orthoMetadata["acronym"] + ", " + orthoMetadata["name"] + " (" + orthoMetadata["prov_name"] + ", " + orthoMetadata["region"] + ", " + orthoMetadata["year"] + ")</span></p>");
  $("#metadata_text").append("<p><span class='metadata_label'>Year of discovery</span><span class='metadata_value'>" + orthoMetadata["year_discovery"] + "</span></p>");
  $("#metadata_text").append("<p><span class='metadata_label'>Coordinates (WGS84)</span><span class='metadata_value'>" + long + ", " + lat + "</span></p>");
  $("#metadata_text").append("<p><span class='metadata_label'>Sample radius</span><span class='metadata_value'>" + sample_radius_size_meters + " meters</span></p>");
  $("#metadata_text").append("<p><span class='metadata_label'>Image side</span><span class='metadata_value'>" + canvas_pixel_size * image_resolution + " meters</span></p>");
  $("#metadata_text").append("<p><span class='metadata_label'>Download time</span><span class='metadata_value'>" + orthoMetadata["wms_download_time"] + "</span></p>");
  $("#metadata_text").append("<p><span class='metadata_label'>WMS service</span><span class='metadata_value'>" + orthoMetadata["wms_url"] + "</span></p>");
  $("#metadata_text").append("<p><span class='metadata_label'>WMS layer</span><span class='metadata_value'>" + orthoMetadata["layer"] + "</span></p>");
  $("#metadata_text").append("<p><a class='google_link' href='" + getGoogleURL() + "' target='_blank'>see on Google Maps</a></p>");

}

function rescaleResultsToOriginalImageSize(grid) {
  //clone array since arrays are passed by reference and if not grid_list gets modified too
  var grid_results = JSON.parse(JSON.stringify(grid));

  for (var i = 0; i < grid.length; i++) {
    scale_factor = Math.round((image_pixel_size - canvas_pixel_size) / 2);
    grid_results[i].xc = grid_results[i].xc + scale_factor;
    grid_results[i].yc = grid_results[i].yc + scale_factor;
  }
  return (grid_results);
}

function sendResults() {
  // alert(JSON.stringify(res));
  results = JSON.stringify(validation_data);
  $.ajax({
    type: "POST",
    url: f_accuracy_sample,
    data: results,
    success: function(msg) {
      alert("Successfully saved!");
    },
    error: function(errormessage) {
      // alert(JSON.stringify(errormessage));
      alert("ERROR: Data not saved!");
    }
  });
}

function getGoogleURL() {
  lat = orthoMetadata["lat_epsg4326"] + "N";
  if (orthoMetadata["long_epsg4326"] <= 0) {
    long = Math.abs(orthoMetadata["long_epsg4326"]) + "W";
  } else {
    long = Math.abs(orthoMetadata["long_epsg4326"]) + "E";
  }
  url = "https://maps.google.de/maps?q=" + lat + "," + long + "&t=k"
  // url = "https://www.google.com/maps/search/?api=1&views=satellite&query=" + lat + "," + long;
  return (url);
}

function seeMetadata() {
  alert(JSON.stringify(orthoMetadata));
}
