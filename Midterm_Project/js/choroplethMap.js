class ChoroplethMap {

  /**
   * Class constructor with basic configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _geoData, _valueData) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 1000,
      containerHeight: _config.containerHeight || 500,
      margin: _config.margin || {top: 10, right: 10, bottom: 10, left: 10},
      tooltipPadding: 10,
      legendBottom: 50,
      legendLeft: 50,
      legendRectHeight: 12, 
      legendRectWidth: 150
    }

    // this.valueData = _valueData;


    this.data = _geoData;
    this.us = _geoData;
    this.year = "2021";

    this.active = d3.select(null);

    this.initVis();
  }

  // Helper function for checking if a 
  has_value(d) { 
    return d.properties.air_data != undefined && d.properties.air_data.has(this.year) && d.properties.air_data.get(this.year)[0]['Days with AQI'] < 366;
  };
  
  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;

    let year = "2021";

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append('svg')
      .attr('class', 'center-container')
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    vis.svg.append('rect')
      .attr('class', 'background center-container')
      .attr('height', vis.config.containerWidth ) //height + margin.top + margin.bottom)
      .attr('width', vis.config.containerHeight) //width + margin.left + margin.right)
      .on('click', vis.clicked);

    vis.projection = d3.geoAlbersUsa()
      .translate([vis.width /2 , vis.height / 2])
      .scale(vis.width);

    vis.colorScale = d3.scaleLinear()
      //.domain([d3.extent(vis.valueData, d => d.Days_with_AQI)])
      .domain([0, 365])
      .range(['#cfe2f2', '#0d306b'])
      .interpolate(d3.interpolateHcl);

    vis.path = d3.geoPath()
      .projection(vis.projection);

    vis.g = vis.svg.append("g")
      .attr('class', 'center-container center-items us-state')
      .attr('transform', 'translate('+vis.config.margin.left+','+vis.config.margin.top+')')
      .attr('width', vis.width + vis.config.margin.left + vis.config.margin.right)
      .attr('height', vis.height + vis.config.margin.top + vis.config.margin.bottom)
    
    vis.updateVis(this.year);

    // MOUSE FUNCTIONALITY
    vis.counties
      .on('mousemove', (d,event) => {
        // console.log(d);
        // console.log(event);
        const displayValue = vis.has_value(d) ? `<strong>${d.properties.air_data.get(year)[0]['Days with AQI']}</strong> ${'Days with AQI'}` : 'No fipsData available'; 
        d3.select('#tooltip')
          .style('display', 'block')
          .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
          .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
          .html(`
            <div class="tooltip-title">${d.properties.name}</div>
            <div>${displayValue}</div>
          `);
      })
      .on('mouseleave', () => {
        d3.select('#tooltip').style('display', 'none');
      })
      .on('click', (d) => {
        const displayValue = vis.has_value(d) ? `<strong>${d.properties.air_data.get(year)[0]['Days with AQI']}</strong> ${'Days with AQI'}` : 'No fipsData available'; 
        console.log(displayValue);
      });



    vis.g.append("path")
      .datum(topojson.mesh(vis.us, vis.us.objects.states, function(a, b) { return a !== b; }))
      .attr("id", "state-borders")
      .attr("d", vis.path);

  }

  updateVis(year) {
    // DRAW COUNTIES
    let vis = this;
    vis.year = year;
    vis.counties = vis.g.append("g")
      .attr("id", "counties")
      .selectAll("path")
      .data(topojson.feature(vis.us, vis.us.objects.counties).features)
      .enter().append("path")
      .attr("d", vis.path)
      // .attr("class", "county-boundary")
      .attr('fill', d => {
        if (vis.has_value(d)) {
          return vis.colorScale(d.properties.air_data.get(year)[0]['Days with AQI']);
        } else {
          return 'url(#lightstripe)';
        }
      });
  }

  
}