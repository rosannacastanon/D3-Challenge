var svgWidth = 960;
var svgHeight = 500;

var margin = {
  top: 20,
  right: 40,
  bottom: 80,
  left: 100
}

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold our chart,
// and shift the latter by left and top margins.
var svg = d3
  .select("#scatter")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

// Append an SVG group
var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// create variables for default graph axis setting
var chosenXAxis = "poverty";
var chosenYAxis = "healthcare";
var radius = 8

// function used for updating x-scale var upon click on axis label
function xScale(demData, chosenXAxis) {
  // create scales on the x-axis
  var xLinearScale = d3.scaleLinear()
    .domain([d3.min(demData, d => d[chosenXAxis]) * 0.8,
    d3.max(demData, d => d[chosenXAxis]) * 1.2
    ])
    .range([0, width]);
  return xLinearScale;
};

// function used for updating y-scale var upon click on axis label
function yScale(demData, chosenYAxis) {
  // create scales on the x-axis
  var yLinearScale = d3.scaleLinear()
    .domain([d3.min(demData, d => d[chosenYAxis]) * 0.8,
    d3.max(demData, d => d[chosenYAxis]) * 1.1
    ])
    .range([height, 0]);
  return yLinearScale;
};

// function used for updating xAxis var upon click on axis label
function renderXAxis(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);
  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);
  return xAxis;
};

// function used for updating yAxis var upon click on axis label
function renderYAxis(newYScale, yAxis) {
  var leftAxis = d3.axisLeft(newYScale);
  yAxis.transition()
    .duration(1000)
    .call(leftAxis);
  return yAxis;
};

// function to create circles that change based on chosen axis
function renderCircles(circlesGroup, newXScale, newYScale, chosenXAxis, chosenYAxis) {
  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[chosenXAxis]))
    .attr("cy", d => newYScale(d[chosenYAxis]));
  return circlesGroup;
};

// function for lables to go inside cirsles on graph
function renderLabels(labelsGroup, newXScale, newYScale, chosenXAxis, chosenYAxis) {
  labelsGroup.transition()
    .duration(1000)
    .attr("x", d => newXScale(d[chosenXAxis]))
    .attr("y", d => newYScale(d[chosenYAxis]) + radius / 3);
  return labelsGroup;
};

// function for updating circles with new tooltip
function updateToolTip(chosenXAxis, chosenYAxis, labelsGroup) {
  var xLabelTool;
  var yLabelTool;

  // X Axis cases
  switch (chosenXAxis) {
    case "poverty": xLabelTool = "Poverty (%)";
      break;
    case "age": xLabelTool = "Age (Median)";
      break;
    case "income": xLabelTool = "Median Household Income";
      break;
  }

  // Y Axis cases
  switch (chosenYAxis) {
    case "healthcare": yLabelTool = "Lacks Healthcare (%)";
      break;
    case "smokes": yLabelTool = "Smokes (%)";
      break;
    case "obesity": yLabelTool = "Obesity (%)";
      break;
  }

  // toolip
  var toolTip = d3.tip()
    .attr("class", "d3-tip")
    .offset([80, -60])
    .html(function (d) {
      return (`${d.state}<br>${xLabelTool} ${d[chosenXAxis]}<br>${yLabelTool} ${d[chosenYAxis]}`)
    });

  // declare handlers
  labelsGroup.call(toolTip);
  labelsGroup.on("mouseover", function (data) {
    toolTip.show(data);
  })
    .on("mouseout", function (data, index) {
      toolTip.hide(data);
    });
  return labelsGroup;
}

// Retrieve data from the CSV file and execute everything below
d3.csv("assets/data/data.csv").then(function (demData, err) {
  if (err) throw err;

  // parse data
  demData.forEach(function (data) {
    data.poverty = +data.poverty;
    data.income = +data.income;
    data.obesity = +data.obesity;
    data.age = +data.age;
    data.smokes = +data.smokes;
    data.healthcare = +data.healthcare;
  });

  // x and y LinearScale function above csv import
  var xLinearScale = xScale(demData, chosenXAxis);
  var yLinearScale = yScale(demData, chosenYAxis);

  // Create initial X and Y axis functions
  var bottomAxis = d3.axisBottom(xLinearScale);
  var leftAxis = d3.axisLeft(yLinearScale);

  // append axis to SVG
  var xAxis = chartGroup.append("g")
    .classed("x-axis", true)
    .attr("transform", `translate(0, ${height})`)
    .call(bottomAxis);
  var yAxis = chartGroup.append("g")
    .call(leftAxis);

  // render circles
  var circlesGroup = chartGroup.selectAll("circle")
    .data(demData)
    .enter()
    .append("circle")
    .classed("stateCircle", true)
    .attr("cx", d => xLinearScale(d[chosenXAxis]))
    .attr("cy", d => yLinearScale(d[chosenYAxis]))
    .attr("r", radius);

  // render state labels
  var labelsGroup = chartGroup.selectAll(".stateText")
    .data(demData)
    .enter()
    .append("text")
    .classed("stateText", true)
    .attr("x", d => xLinearScale(d[chosenXAxis]))
    .attr("y", d => yLinearScale(d[chosenYAxis + radius / 3]))
    .attr("font-size", radius)
    .text(d => d.abbr);

  // Create group for x-axis labels
  var xLabels = chartGroup.append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`);

  var povertyLabel = xLabels.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("value", "poverty") // value to grab for event listener
    .classed("active", true)
    .text("In Poverty (%)");

  var incomeLabel = xLabels.append("text")
    .attr("x", 0)
    .attr("y", 40)
    .attr("value", "income") // value to grab for event listener
    .classed("inactive", true)
    .text("Household Income (Median)");

  var ageLabel = xLabels.append("text")
    .attr("x", 0)
    .attr("y", 60)
    .attr("value", "age") // value to grab for event listener
    .classed("inactive", true)
    .text("Age (Median)");

  // Create group for y-axis labels
  var yLabels = chartGroup.append("g")
    .attr("transform", "rotate(-90)");

  var obesityLabel = yLabels.append("text")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .classed("inactive", true)
    .attr("value", "obesity") // value to grab for event listener
    .text("Obesity (%)");

  var smokesLabel = yLabels.append("text")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "2em")
    .classed("inactive", true)
    .attr("value", "smokes") // value to grab for event listener
    .text("Smokes (%)");

  var healthcareLabel = yLabels.append("text")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "3em")
    .classed("active", true)
    .attr("value", "healthcare") // value to grab for event listener
    .text("Lacks Healthcare (%)");

  // create toolTips based on selection
  var labelsGroup = updateToolTip(chosenXAxis, chosenYAxis, labelsGroup);

  // x axis labels event listener
  xLabels.selectAll("text")
    .on("click", function () {
      // get value of selection
      var value = d3.select(this).attr("value");
      if (value !== chosenXAxis) {

        // replaces chosenXAxis with value
        chosenXAxis = value;

        // console.log(chosenXAxis)

        // updates x scale for new data
        xLinearScale = xScale(demData, chosenXAxis);

        // updates x axis with transition
        xAxis = renderXAxis(xLinearScale, xAxis);

        // updates circles with new x values
        circlesGroup = renderCircles(circlesGroup, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);
        labelsGroup = renderLabels(labelsGroup, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);

        // updates tooltips with new info
        labelsGroup = updateToolTip(chosenXAxis, chosenYAxis, labelsGroup);

        // changes classes to change bold text
        switch (chosenXAxis) {
          case "poverty": (
            povertyLabel.classed("active", true).classed("inactive", false),
            incomeLabel.classed("active", false).classed("inactive", true),
            ageLabel.classed("active", false).classed("inactive", true)
          )
            break;
          case "age": (
            povertyLabel.classed("active", false).classed("inactive", true),
            incomeLabel.classed("active", false).classed("inactive", true),
            ageLabel.classed("active", true).classed("inactive", false)
          )
            break;
          case "income": (
            povertyLabel.classed("active", false).classed("inactive", true),
            incomeLabel.classed("active", true).classed("inactive", false),
            ageLabel.classed("active", false).classed("inactive", true)
          )
            break;
        }
      }
    });

  // y axis labels event listener
  yLabels.selectAll("text")
    .on("click", function () {
      // get value of selection
      var value = d3.select(this).attr("value");
      if (value !== chosenYAxis) {

        // replaces chosenYAxis with value
        chosenYAxis = value;

        // console.log(chosenYAxis)

        // updates y scale for new data
        yLinearScale = yScale(demData, chosenYAxis);

        // updates x axis with transition
        yAxis = renderYAxis(yLinearScale, yAxis);

        // updates circles with new y values
        circlesGroup = renderCircles(circlesGroup, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);
        labelsGroup = renderLabels(labelsGroup, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);

        // updates tooltips with new info
        labelsGroup = updateToolTip(chosenXAxis, chosenYAxis, labelsGroup);

        // changes classes to change bold text
        switch (chosenYAxis) {
          case "healthcare": (
            healthcareLabel.classed("active", true).classed("inactive", false),
            obesityLabel.classed("active", false).classed("inactive", true),
            smokesLabel.classed("active", false).classed("inactive", true)
          )
            break;
          case "smokes": (
            healthcareLabel.classed("active", false).classed("inactive", true),
            obesityLabel.classed("active", false).classed("inactive", true),
            smokesLabel.classed("active", true).classed("inactive", false)
          )
            break;
          case "obesity": (
            healthcareLabel.classed("active", false).classed("inactive", true),
            obesityLabel.classed("active", true).classed("inactive", false),
            smokesLabel.classed("active", false).classed("inactive", true)
          )
            break;
        }
      }
    })
});
