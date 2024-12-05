import * as d3 from "https://cdn.jsdelivr.net/npm/d3@6/+esm";

// Fixed mapping of dog names to colors
const nameToColor = {
  "CHARLIE": "rgb(255, 160, 122)",  // Color 1
  "LUNA": "rgb(255, 208, 122)",     // Color 2
  "LUCY": "rgb(191, 255, 122)",     // Color 3
  "BELLA": "rgb(122, 255, 160)",    // Color 4
  "LOLA": "rgb(122, 226, 255)",     // Color 5
  "MAX": "rgb(122, 175, 255)",      // Color 6
  "COCO": "rgb(171, 122, 255)",     // Color 7
  "DAISY": "rgb(226, 122, 255)",    // Color 8
  "TEDDY": "rgb(255, 122, 180)",    // Color 9
  "OLIVER": "rgb(207, 27, 96)",     // Color 10
  "ROCKY": "rgb(228, 230, 226)",
  "LUCKY": "rgb(96, 41, 202)",
  "MILO": "rgb(146, 153, 81)",
  "PRINCESS": "rgb(63, 19, 110)",
  "NOT": "rgb(227, 226, 222)",
  "BUDDY": "rgb(60, 138, 176)",
  "BAILEY": "rgb(149, 232, 126)",
  "MOLLY": "rgb(154, 246, 166)"
}

// Function to load data
function loadData(filePath) {
  return d3.csv(filePath).then(data => {
    return data;
  }).catch(error => {
    console.error('Error loading CSV data:', error);
    return null;
  });
}

// Initialize and load multiple datasets
async function initialize() {
  const datasets = [
    { file: 'data/dog_name_time_count_trends-mn.csv', container: '#chart1' },
    { file: 'data/dog_name_time_count_trends-bk.csv', container: '#chart2' },
    { file: 'data/dog_name_time_count_trends-bx.csv', container: '#chart3' },
    { file: 'data/dog_name_time_count_trends-qn.csv', container: '#chart4' },
    { file: 'data/dog_name_time_count_trends-si.csv', container: '#chart5' }
  ];

  for (const dataset of datasets) {
    const data = await loadData(dataset.file);
    if (data) {
      generateLineChart(data, dataset.container);
    }
  }
}

// Function to generate a line chart for dog name trends
async function generateLineChart(data, chartId) {
  data.forEach(d => {
    d.AnimalBirthYear = +d.AnimalBirthYear;
    d.Count = +d.Count;
  });

  const topNames = Array.from(d3.rollups(data, v => d3.sum(v, d => d.Count), d => d.AnimalName))
    .sort((a, b) => d3.descending(a[1], b[1]))
    .slice(0, 10)
    .map(d => d[0]);

  const filteredData = data.filter(d => topNames.includes(d.AnimalName));

  const nestedData = Array.from(d3.group(filteredData, d => d.AnimalName), ([key, values]) => ({ key, values }));

  const margin = { top: 50, right: 50, bottom: 150, left: 60 };
  const width = 550 - margin.left - margin.right;
  const height = 540 - margin.top - margin.bottom;

  const svg = d3.select(chartId)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.AnimalBirthYear))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.Count)])
    .range([height, 0]);

  const line = d3.line()
    .x(d => x(d.AnimalBirthYear))
    .y(d => y(d.Count));

  // Draw the lines
  svg.selectAll(".line")
    .data(nestedData)
    .enter()
    .append("path")
    .attr("class", "line")
    .attr("d", d => line(d.values))
    .attr("stroke", d => nameToColor[d.key] || "black") // Use color from the mapping or fallback to black
    .attr("fill", "none")
    .attr("stroke-width", 2);

  // Add data points (nodes)
  svg.selectAll(".circle")
    .data(filteredData)
    .enter()
    .append("circle")
    .attr("class", "data-point")
    .attr("cx", d => x(d.AnimalBirthYear))
    .attr("cy", d => y(d.Count))
    .attr("r", 4)
    .attr("fill", d => nameToColor[d.AnimalName] || "black")
    .on("mouseover", function (event, d) {
      // Show tooltip on hover
      d3.select("#tooltip")
        .style("opacity", 1)
        .html(`Name: ${d.AnimalName}<br>Year: ${d.AnimalBirthYear}<br>Count: ${d.Count}`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`);
    })
    .on("mouseout", () => {
      // Hide tooltip
      d3.select("#tooltip").style("opacity", 0);
    });

  // Add Axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svg.append("g")
    .call(d3.axisLeft(y));

  // Add X-axis label
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .attr("font-family", "Avenir, sans-serif")
    .attr("font-size", "12px")
    .attr("fill", "#333")
    .text("Year");

  // Add Y-axis label
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -40)
    .attr("text-anchor", "middle")
    .attr("font-family", "Avenir, sans-serif")
    .attr("font-size", "12px")
    .attr("fill", "#333")
    .text("Count");

  // Add horizontal legend with fixed colors
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(0, ${height + 60})`);

  const legendSpacing = 100;
  const legendRowHeight = 30;

  topNames.forEach((name, i) => {
    const xOffset = (i % 5) * legendSpacing;
    const yOffset = Math.floor(i / 5) * legendRowHeight;

    const legendRow = legend.append("g")
      .attr("transform", `translate(${xOffset}, ${yOffset})`);

    // Add the horizontal line
    legendRow.append("line")
      .attr("x1", 0)
      .attr("x2", 30)
      .attr("y1", 10)
      .attr("y2", 10)
      .attr("stroke", nameToColor[name] || "black")
      .attr("stroke-width", 2);

    // Add the circle
    legendRow.append("circle")
      .attr("cx", 15)
      .attr("cy", 10)
      .attr("r", 5)
      .attr("fill", nameToColor[name] || "black");

    // Add the text
    legendRow.append("text")
      .attr("x", 40)
      .attr("y", 15)
      .attr("font-family", "Avenir, sans-serif")
      .attr("font-size", "12px")
      .attr("fill", "#333")
      .text(name);
  });
}

// Add Tooltip Element to Body
d3.select("body")
  .append("div")
  .attr("id", "tooltip")
  .style("position", "absolute")
  .style("background", "#fff")
  .style("border", "1px solid #ccc")
  .style("border-radius", "4px")
  .style("padding", "8px")
  .style("pointer-events", "none")
  .style("opacity", 0);

// Call the initialize function to render the charts
initialize();