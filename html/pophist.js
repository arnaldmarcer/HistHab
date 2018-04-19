	var dir_results = "";
	var dir_orthos = "";
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
	var selected_grid_square_colour = '#FF0040';
	var sample_circle_colour = 'red';
	var image_pixel_size = 1000;
	var canvas_pixel_size = 600;
	var selected_lc_type = "";
	var time_line = [];
	var selected_square = null;
	var user_name = ""
	var user_ip = ""
	var time_options = {
	  timeZone: 'Europe/Madrid',
	  year: 'numeric',
	  month: 'numeric',
	  day: 'numeric',
	  hour: 'numeric',
	  minute: 'numeric',
	  second: 'numeric'
	};

	$(document).ready(function() {
	  $.ajax({
	    type: "GET",
	    url: "../env/config.json",
	    success: function(data) {
	      dir_orthos = data['dir_orthos'];
	      dir_results = data['dir_results'] + "/";
				loadRegion();
	      initApplication();
	    },
	    error: function(errormessage) {
	      alert("Could not read configuration file!")
	    }
	  });

	});

	function initApplication(){
	$('img').click(function() {
	  $('.selected').removeClass('selected');
	  $(this).addClass('selected');
	  selected_lc_type = $(this).attr('id');
	  if (selected_lc_type == "blank") {
	    selected_lc_type = "";
	  }
	  document.getElementById("label_grid_square_all_years").innerHTML = "Labell all years as " + selected_lc_type;
	});
	user_name = $('#user_name').val();
	user_ip = $('#user_ip').val();
	document.getElementById('region').onchange.call();

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

	function timeLine(sq) {
	  var region = $("#region :selected").val();
	  var acronym = $("#acronym :selected").val();
	  acronym = acronym.split(" - ")[0].toLowerCase();
	  var year_select = $("#year :selected").val();
	  var resolution = $("#resolution :selected").val();
	  // alert(sq.xc + "," + sq.yc);
	  images_metadata = getPopulationImagesMetadata();
	  images_metadata.reverse();
	  images = [];
	  for (var i = 0; i < images_metadata.length; i++) {
	    src = dir_orthos + region + "/" + acronym + "\_ortho_" + images_metadata[i][1] + "_r" + images_metadata[i][2] + "_2km.jpg";
	    images.push(src);
	  }
	  // alert(images);
	  images = images.map(function(i) {
	    var img = document.createElement("img");
	    img.src = i;
	    return img;
	  });
	  Promise.all(images.map(function(image) {
	      return new Promise(function(resolve, reject) {
	        image.onload = resolve;
	      });
	    }))
	    .then(function() {
	      $('#tl_images_div').empty();
	      for (var i = 0; i < images.length; i++) {
	        var img = images[i];
	        c = document.createElement('canvas');
	        c.width = sq.xs;
	        c.height = sq.ys;
	        ctx = c.getContext("2d");
	        x = sq.xc + Math.round((image_pixel_size - canvas_pixel_size) / 2);
	        y = sq.yc + Math.round((image_pixel_size - canvas_pixel_size) / 2);
	        xd = (i * sq.xs) + 4 * i;
	        ctx.drawImage(img, x, y, sq.xs, sq.ys, 0, 0, sq.xs, sq.ys);
	        year = images_metadata[i][1];
	        // DIV ELEMENT THAT CONTAINS EACH LABELLED GRID SQUARE IMAGE FOR A GIVEN YEAR
	        var tl_image = document.createElement("div");
	        tl_image.className = 'tl_image';
	        tl_image.id = acronym + "-" + year;
	        // YEAR TEXT WITHIN
	        var tl_image_year = document.createElement("p");
	        tl_image_year.id = 'tl_image_year_' + year;
	        tl_image_year.innerHTML = year;
	        tl_image_year.className = 'tl_image_item';
	        // IMAGE WITHIN
	        var elem = document.createElement("img");
	        elem.setAttribute("src", c.toDataURL());
	        elem.setAttribute("height", "50");
	        elem.setAttribute("width", "50");
	        elem.className = 'tl_image_item';
	        elem.id = 'tl_image_img_' + year;
	        elem.onclick = function() {
	          $('.selected_tl_image').removeClass('selected_tl_image');
	          $(this).addClass('selected_tl_image');
	          $('#year option[value=' + this.id.split("_").reverse()[0] + ']').prop('selected', true);
	          fillResolutionsSelect(false);
	          drawGridSquare(ctx, selected_square, selected_grid_square_colour, 2);
	        };
	        // LABEL WITHIN
	        var tl_image_label = document.createElement("p");
	        // alert(JSON.stringify(selected_square));
	        tl_image_label.id = 'tl_image_label_' + year;
	        tl_image_label.innerHTML = "-";
	        label = getSelectedSquareLabel(year);
	        if (label != null && label != ""){
            sql = getSelectedSquareLabel(year);
	          tl_image_label.innerHTML = sql;
            tl_image_label.style.color = getLCcolor(sql);
          }
	        tl_image_label.className = 'tl_image_item';
	        tl_image_label.onclick = function() {
	          if (selected_lc_type != "") {
	            setSelectedSquareLabel($(this).attr("id").split("_").reverse()[0]);
	            document.getElementById('tl_image_label_' + $(this).attr("id").split("_").reverse()[0]).innerHTML = selected_lc_type;
	            document.getElementById('tl_image_label_' + $(this).attr("id").split("_").reverse()[0]).style.color = getLCcolor(selected_lc_type);
	          } else {
	            document.getElementById('tl_image_label_' + $(this).attr("id").split("_").reverse()[0]).innerHTML = "-";
	          }
	          drawImage(false);
	        };
	        tl_image.appendChild(tl_image_year);
	        tl_image.appendChild(elem);
	        tl_image.appendChild(tl_image_label);
	        document.getElementById("tl_images_div").appendChild(tl_image);
	        $('.selected_tl_image').removeClass('selected_tl_image');
	        $('#tl_image_img_' + $("#year :selected").val() + '').addClass('selected_tl_image');
	      }
	    });
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

	function generateGrid() { //JSON version
	  var c = document.createElement('canvas');
	  var ctx = c.getContext("2d");

	  grid_list = [];
	  grid_number = 1;
	  years = [];
	  years = $('#year option').each(function() {
	    years.push($(this).val());
	  });
	  // alert(years.length);
	  npx_radius = Math.round(sample_radius_size_meters / image_resolution);
	  step = Math.round(grid_square_size_meters / image_resolution);
	  half_step = Math.round(step / 2);
	  for (i = 0; i < years.length; i++) {
	    for (var y = yc - npx_radius; y <= yc + npx_radius; y = y + step) {
	      for (var x = xc - npx_radius; x <= xc + npx_radius; x = x + step) {
	        gsq_center_x = x + half_step;
	        gsq_center_y = y + half_step;
	        sq_distance_to_population = Math.pow(gsq_center_x - xc, 2) + Math.pow(gsq_center_y - yc, 2);
	        if (sq_distance_to_population > Math.pow(npx_radius, 2)) {
	          continue;
	        }
	        grid_square = [grid_number, x, y, step, step, ""];
	        grid_square = new GridSquare(grid_number, x, y, step, step, years[i].value, "")
	        grid_list.push(grid_square);
	        grid_number = grid_number + 1;
	      }
	    }
	  }
	  selected_square = grid_list[0];
	}

	function setNewGridCoordinates() {
	  shift = Math.round((canvas_pixel_size - image_pixel_size) / 2);
	  xc = xc + shift;
	  yc = yc + shift;
	  for (var i = 0; i < grid_list.length; i++) {
	    grid_list[i].xc = grid_list[i].xc + shift;
	    grid_list[i].yc = grid_list[i].yc + shift;
	  }
	  // alert(["setNewGridCoordinates", xc,yc]);
	}

	function GridSquare(id, xc, yc, sx, sy, year, label) {
	  a = {};
	  a.id = id;
	  a.xc = xc;
	  a.yc = yc;
	  a.xs = sx;
	  a.ys = sy;
	  a.year = year;
	  a.label = label;
	  a.user = user_name;
	  a.ip = user_ip;
	  a.timestamp = (new Date()).toLocaleString('en-GB', time_options);
	  return a;
	}

	function getRegionFiles() {
	  var region = $("#region :selected").val();
	  // url = "/" + dir_orthos + region + ".txt";
	  url = "?region=" + region;
	  $.ajax({
	    type: "GET",
	    url: url,
	    success: function(data) {
	      buildPopulationsInfoFromData(data);
	      fillPopulationsSelect();
	    }
	  });
	}

	function loadRegion() {
	  getRegionFiles();
	}

	function buildPopulationsInfoFromData(data) {
	  regionPopInfo = [];
	  for (var i = 0; i < data.length; i++) {
	    pop = data[i];
	    info = [pop.acronym, pop.year, pop.resolution, pop.extension, pop.name];
	    regionPopInfo.push(info);
	  }
	}

	function fillPopulationsSelect() {
	  // var x=$("#region :selected").val();
	  // alert(x);
	  var pops = [];
	  for (var i = 0; i < regionPopInfo.length; i++) {
	    pops.push(regionPopInfo[i][0].toUpperCase() + " - " + regionPopInfo[i][4]);
	  }
	  unique = pops.filter(function(item, i, ar) {
	    return ar.indexOf(item) === i;
	  });
	  unique.sort();
	  acronym_sel = "";
	  for (var j = 0; j < unique.length; j++) {
	    acronym_sel = acronym_sel + "<option value='" + unique[j] + "'>" + unique[j] + "</option>";
	  }
	  // $('#acronym').css('font-family', 'monospace');
	  $("#acronym").html(acronym_sel);
	  $('#acronym option')[0].selected = true;

	  fillYearsSelect();
	}

	function fillYearsSelect() {
	  var acronym = $("#acronym :selected").val();
	  acronym = acronym.split(" - ")[0].toLowerCase();
	  var years = [];
	  for (var i = 0; i < regionPopInfo.length; i++) {
	    if (regionPopInfo[i][0] == acronym) {
	      years.push(regionPopInfo[i][1]);
	    }
	  }
	  unique = years.filter(function(item, i, ar) {
	    return ar.indexOf(item) === i;
	  });
	  unique = unique.sort(function(a, b) {
	    return b - a
	  }); // needs comparing function to sort as numbers
	  year_sel = "";
	  for (var j = 0; j < unique.length; j++) {
	    year_sel = year_sel + "<option value='" + unique[j] + "'>" + unique[j] + "</option>";
	  }
	  $("#year").html(year_sel);
	  fillResolutionsSelect(true);
	}

	// Have decided to leave the resolution select as hidden in order not to confuse
	// the user. We simply use the best resolution available for each population.
	function fillResolutionsSelect(also_read_data) {
	  var acronym = $("#acronym :selected").val();
	  acronym = acronym.split(" - ")[0].toLowerCase();
	  var year = $("#year :selected").val();
	  var c = document.createElement('canvas');
	  var ctx = c.getContext("2d");

	  var resolutions = [];
	  for (var i = 0; i < regionPopInfo.length; i++) {
	    if (regionPopInfo[i][0] == acronym && regionPopInfo[i][1] == year) {
	      resolutions.push(regionPopInfo[i][2]);
	    }
	  }
	  unique = resolutions.filter(function(item, i, ar) {
	    return ar.indexOf(item) === i;
	  });
	  unique = unique.sort(function(a, b) {
	    return a - b
	  }); // needs comparing function to sort as numbers
	  resolution_sel = "";
	  for (var j = 0; j < unique.length; j++) {
	    resolution_sel = resolution_sel + "<option value='" + unique[j] + "'>" + unique[j] + "</option>";
	  }
	  $("#resolution").html(resolution_sel);
	  $('#resolution option')[0].selected = true;

    $('.selected_tl_image').removeClass('selected_tl_image');
    if(document.getElementById("tl_image_img_" + year) != null){
      $('#tl_image_img_' + $("#year :selected").val() + '').addClass('selected_tl_image');
      // document.getElementById("tl_image_img_" + year).addClass('selected_tl_image');
    }
	  readOrthoMetadata();
	  // url = "https://www.google.com/maps/search/?api=1&basemap=satellite&query=" + orthoMetadata.lat + "," + orthoMetadata.lat;
	  // $("#google_maps").attr("href", url)
	  if (also_read_data) {
	    readData();
	  } else {
	    drawImage(false);
	  }
	}

	function drawImage(only_ortho) {
	  var region = $("#region :selected").val();
	  var acronym = $("#acronym :selected").val();
	  acronym = acronym.split(" - ")[0].toLowerCase();
	  var year = $("#year :selected").val();
	  var resolution = $("#resolution :selected").val();
	  var c = document.getElementById("canvas");
	  var ctx = c.getContext("2d");
	  c.width = canvas_pixel_size;
	  c.height = canvas_pixel_size;
	  ctx.clearRect(0, 0, c.width, c.height);
	  var image = new Image();
	  image.onload = function() {
	    ux = Math.round((image_pixel_size - canvas_pixel_size) / 2);
	    uy = Math.round((image_pixel_size - canvas_pixel_size) / 2);
	    ctx.drawImage(image, ux, uy, canvas_pixel_size, canvas_pixel_size, 0, 0, canvas_pixel_size, canvas_pixel_size);
	    if (!only_ortho) {
	      drawGrid();
	      if (selected_square != null) {
	        drawGridSquare(ctx, selected_square, selected_grid_square_colour, 2);
	      }
	    }
	  }
	  image.src = dir_orthos + region + "/" + acronym + "\_ortho_" + year + "_r" + resolution + "_2km.jpg";
		// alert(image.src);
	}

	function drawCircle() {
	  var canvas = document.getElementById('canvas');
	  var context = canvas.getContext('2d');
	  // alert(["drawCircle", xc,yc]);
	  context.beginPath();
	  context.arc(xc, yc, Math.round(sample_radius_size_meters / image_resolution), 0, 2 * Math.PI);
	  context.strokeStyle = sample_circle_colour;
	  context.lineWidth = 2;
	  context.setLineDash([16]);
	  context.stroke();
	  context.closePath();
	}

	function drawGrid() {
	  var canvas = document.getElementById('canvas');
	  var context = canvas.getContext('2d');
	  drawCircle();
	  context.beginPath();
	  context.arc(xc, yc, Math.round(population_location_radius_meters / image_resolution), 0, 2 * Math.PI);
	  context.strokeStyle = 'red';
	  context.setLineDash([0]);
	  context.stroke();
	  context.closePath();
	  // We only draw for one year since this is a collection of squares for all years
	  var year = $("#year :selected").val();
	  grid_selection = _.filter(grid_list, function(sq) {
	    return sq.year == year
	  });
	  // alert(grid_selection.length);
	  for (var i = 0; i < grid_selection.length; i++) {
	    context.beginPath();
	    grid_square = grid_selection[i];
	    x_center = Math.round(parseInt(grid_square.xc) + parseInt(grid_square.xs) / 2)
	    y_center = Math.round(parseInt(grid_square.yc) + parseInt(grid_square.ys) / 2)
	    drawGridSquare(context, grid_square, grid_square_colour, 1);
	    context.font = "16px 'Courier New', courier, monospace";
	    if (grid_square.label != null || grid_square.label == "none") {
	      // str = grid_square.label.toUpperCase()
	      str = grid_square.label
	      context.strokeStyle = getLCcolor(str);
	      // context.globalAlpha = 0.8;
	      context.strokeText(str, x_center - 8, y_center + 5);
	      // context.globalAlpha = 1.0;
	    }
	  }
	}

	function drawGridSquare(context, grid_square, color, width) {
	  context.beginPath();
	  // context.globalAlpha = 0.6;
	  context.rect(grid_square.xc, grid_square.yc, grid_square.xs, grid_square.ys);
	  context.lineWidth = width;
	  context.strokeStyle = color;
	  context.closePath();
	  context.stroke();
	  // context.globalAlpha = 1.0;
	  // context.beginPath();
	  // context.rect(grid_square.xc, grid_square.yc, grid_square.xs, grid_square.ys);
	  // context.lineWidth = width;
	  // context.strokeStyle = color;
	  // context.globalAlpha = 0.1;
	  // context.fillStyle = color;
	  // context.rect(grid_square.xc, grid_square.yc, grid_square.xs, grid_square.ys);
	  // context.closePath();
	  // context.fill();
	  // context.globalAlpha = 1.0;
	  // context.stroke();
	}

	function allGridLabels(label) {
	  var year = $("#year :selected").val();
	  grid_selection = [];
	  grid_selection = _.filter(grid_list, function(sq) {
	    return sq.year == year
	  });
	  for (var i = 0; i < grid_selection.length; i++) {
	    grid_selection[i].label = label;
	  }
	}

	function getGridSquare(x, y) {
	  gs = null;
	  for (var i = 0; i < grid_list.length; i++) {
	    xmin = Math.round(parseInt(grid_list[i].xc))
	    xmax = Math.round(parseInt(grid_list[i].xc) + parseInt(grid_list[i].xs))
	    ymin = Math.round(parseInt(grid_list[i].yc))
	    ymax = Math.round(parseInt(grid_list[i].yc) + parseInt(grid_list[i].ys))
	    if (x >= xmin && x < xmax & y >= ymin && y < ymax) {
	      gs = grid_list[i];
	      return (gs);
	    }
	  }
	}

	function canvasClick(e) {
	  var pos = getMousePos(canvas, e);
	  posx = Math.round(pos.x);
	  posy = Math.round(pos.y);
	  var c = document.getElementById("canvas");
	  var ctx = c.getContext("2d");

	  selected_square = getGridSquare(posx, posy);
	  timeLine(selected_square);
	  if (!$("#reposition_pop").is(':checked')) {
	    if (selected_square == null) //so as not to keep redrawing grid
	      return;
	    // var strHabitat = $("#habitat_type :selected").val();
	    if ($("#labelling_mode").is(':checked')) {
	        alert
	        setGridLabel(posx, posy, selected_lc_type);
	    }
	    drawImage(false);
	  } else {
	    xc = posx;
	    yc = posy;
	    grid_list = [];
	    generateGrid();
	    drawImage(false);
	    $('#reposition_pop').prop('checked', false);
	  }

	}

	function getSelectedSquareLabel(year) {
	  grid_square_in_array = [];
	  grid_square_in_array = _.filter(grid_list, function(sq) {
	    return sq.xc == selected_square.xc && sq.yc == selected_square.yc && sq.year == year;
	  });
	  label = null;
	  if (grid_square_in_array[0] != null)
	    label = grid_square_in_array[0].label;
	  return (label);
	}

	function setSelectedSquareLabel(year) {
	  grid_square_in_array = _.filter(grid_list, function(sq) {
	    return sq.xc == selected_square.xc && sq.yc == selected_square.yc && sq.year == year;
	  });
	  // alert(selected_lc_type + ", " + year);
	  if (grid_square_in_array != null)
	    grid_square_in_array[0].label = selected_lc_type;
	  grid_square_in_array[0].user_name = user_name;
	  grid_square_in_array[0].user_ip = user_ip;
	  grid_square_in_array[0].timestamp = (new Date()).toLocaleString('en-GB', time_options);;
	  // alert(JSON.stringify(grid_square_in_array));
	}

	function setGridLabel(x, y, label) {
	  var year = $("#year :selected").val();
	  var acronym = $("#acronym :selected").val();
	  acronym = acronym.split(" - ")[0].toLowerCase();
	  // alert(label);
	  if (label == "none" || label == "")
	    label = "";
	  grid_square = null;
	  grid_selection = [];
	  grid_selection = _.filter(grid_list, function(sq) {
	    return sq.year == year
	  });
	  // alert(grid_selection.length);
	  for (var i = 0; i < grid_selection.length; i++) {
	    xmin = Math.round(parseInt(grid_selection[i].xc))
	    xmax = Math.round(parseInt(grid_selection[i].xc) + parseInt(grid_selection[i].xs))
	    ymin = Math.round(parseInt(grid_selection[i].yc))
	    ymax = Math.round(parseInt(grid_selection[i].yc) + parseInt(grid_selection[i].ys))
	    if (x >= xmin && x < xmax & y >= ymin && y < ymax) {
	      grid_selection[i].label = label;
	      grid_selection[i].year = year;
	      grid_selection[i].user_ip = user_ip;
	      grid_selection[i].user_name = user_name;
	      grid_selection[i].timestamp = (new Date()).toLocaleString('en-GB', time_options);
	    }
	  }
	}

	function labelGridSquareAllYears() {
	  var selectNodeList = document.getElementById("year");
	  for (var i = 0; i < selectNodeList.length; i++) {
	    if (selected_lc_type != "") {
	      document.getElementById("tl_image_label_" + selectNodeList[i].value).innerHTML = selected_lc_type;
        document.getElementById("tl_image_label_" + selectNodeList[i].value).style.color = getLCcolor(selected_lc_type);
	    } else {
	      document.getElementById("tl_image_label_" + selectNodeList[i].value).innerHTML = "-";
	    }
	  }
	  grid_selection = [];
	  grid_selection = _.filter(grid_list, function(sq) {
	    return (sq.xc == selected_square.xc && sq.yc == selected_square.yc)
	  });
	  for (var i = 0; i < grid_selection.length; i++) {
	    grid_selection[i].label = selected_lc_type;
	  }
    drawImage(false);
	}

	function labelAll() {
	  var habitat = selected_lc_type;
	  allGridLabels(habitat);
	  drawImage(false);
	}

	function eraseAll() {
	  allGridLabels("");
	  drawImage(false);
	}

	function getMousePos(canvas, evt) {
	  var grid_square = canvas.getBoundingClientRect();
	  return {
	    x: evt.clientX - grid_square.left,
	    y: evt.clientY - grid_square.top
	  };
	}

	function readData() {
	  var region = $("#region :selected").val();
	  var acronym = $("#acronym :selected").val();
	  acronym = acronym.split(" - ")[0].toLowerCase();
	  var c = document.createElement('canvas');
	  var ctx = c.getContext("2d");

	  url = dir_results + region + "/" + acronym + ".json";
	  // alert(url);
	  $.ajax({
	    type: "GET",
	    url: url,
	    success: function(data) {
	      drawImage(false);
	      xc = data["xc"];
	      yc = data["yc"];
	      grid_list = data["grid"];
	      setNewGridCoordinates(image_pixel_size, canvas_pixel_size);
	      selected_square = grid_list[0];
	      drawGrid();
	      drawGridSquare(ctx, selected_square, selected_grid_square_colour, 2);
	      timeLine(selected_square);
	    },
	    error: function(errormessage) {
	      resetAndCenterGrid();
	      timeLine(selected_square);
	    }
	  });

	}

	function doReset() {
	  // alert(selected_lc_type);
	  var conf = confirm("Are you sure ? All labels will be erased and grid recentered !")
	  if (conf) {
	    resetAndCenterGrid();
	  }
	}

	function resetAndCenterGrid() {
	  var c = document.createElement('canvas');
	  var ctx = c.getContext("2d");
	  shift = Math.round((canvas_pixel_size - image_pixel_size) / 2);
	  xc = Math.round(image_pixel_size / 2) + shift;
	  yc = Math.round(image_pixel_size / 2) + shift;
	  generateGrid();
	  drawImage(false);
	}

	function repositionGridToNewCanvasSize() {
	  var canvas = document.getElementById('canvas');
	  setNewGridCoordinates(canvas.width, canvas_pixel_size);
	  drawImage(false);
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

	function readOrthoMetadata() {
	  var region = $("#region :selected").val();
	  var acronym = $("#acronym :selected").val();
	  acronym = acronym.split(" - ")[0].toLowerCase();
	  var year = $("#year :selected").val();
	  var resolution = $("#resolution :selected").val();
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

	function JSONResults(region, acronym, xc, yc, grid) {
	  results = {};
	  results.region = region;
	  results.acronym = acronym;
	  shift = Math.round((image_pixel_size - canvas_pixel_size) / 2);
	  results.xc = xc + shift;
	  results.yc = yc + shift;
	  grid = rescaleResultsToOriginalImageSize(grid);
	  results.grid = grid;
	  return results;
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

	function getResults() {
	  var region = $("#region :selected").val();
	  var acronym = $("#acronym :selected").val();
	  acronym = acronym.split(" - ")[0].toLowerCase();
	  results = new JSONResults(region, acronym, xc, yc, grid_list);
	  return (results);
	}

	function sendResults() {
	  res = getResults();
	  // alert(JSON.stringify(res));
	  res = JSON.stringify(res);
		// alert(res);
	  $.ajax({
	    type: "POST",
	    url: dir_results,
	    data: res,
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
