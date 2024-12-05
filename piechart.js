import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Load the CSV data
d3.csv("data/dog_breeds.csv").then(function (data) {
    // Convert count to number
    data.forEach(d => d.Count = +d.Count);

    // Initialize dropdown and render charts
    initializeDropdown(data);
    renderCharts(data, "all");
}).catch(function (error) {
    console.error("Error loading CSV file:", error);
});

function initializeDropdown(data) {
    const dropdown = d3.select("#dogSelector");

    // Get unique dog names and populate dropdown
    const dogNames = Array.from(new Set(data.map(d => d['Dog Name'])));
    dogNames.forEach(dogName => {
        dropdown.append("option").text(dogName).attr("value", dogName);
    });

    // Add change event listener to update charts
    dropdown.on("change", function (event) {
        const selectedDogName = event.target.value;
        renderCharts(data, selectedDogName);
    });
}

function renderCharts(data, selectedDogName) {
    const boroughMapping = {
        "Manhattan": "#piechart1",
        "Brooklyn": "#piechart2",
        "Bronx": "#piechart3",
        "Queens": "#piechart4",
        "Staten Island": "#piechart5"
    };

    const dataByBorough = d3.group(data, d => d['Borough Name']);

    for (const [borough, selector] of Object.entries(boroughMapping)) {
        const boroughContainer = d3.select(selector).html(""); // 清除已有内容
        const boroughData = dataByBorough.get(borough) || [];

        // 根据选中狗的名字过滤数据
        const filteredData = selectedDogName === "all"
            ? boroughData
            : boroughData.filter(d => d['Dog Name'] === selectedDogName);

        if (filteredData.length === 0) {
            boroughContainer.append("p").text(`No data for ${selectedDogName} in ${borough}`);
            continue;
        }

        // 按品种汇总数据
        const aggregatedData = Array.from(d3.rollup(
            filteredData,
            v => d3.sum(v, d => d.Count),
            d => d['Breed Name']
        ), ([key, value]) => ({ 'Breed Name': key, Count: value }));

        aggregatedData.sort((a, b) => b.Count - a.Count);

        // 渲染饼图
        createPieChart(boroughContainer, aggregatedData, borough);
    }
}



function createPieChart(container, data, borough) {
    const width = 350;
    const height = 350;
    const radius = Math.min(width, height) / 2;

    // Custom RGB color palette
    const colorPalette = [
        "rgb(255, 160, 122)",   // Light Coral
        "rgb(255, 208, 122)",   // Light Yellow
        "rgb(191, 255, 122)",   // Light Lime
        "rgb(122, 255, 160)",   // Light Green
        "rgb(122, 226, 255)",   // Light Cyan
        "rgb(122, 175, 255)"    // Light Blue
    ];

    const colorScale = d3.scaleOrdinal()
        .domain(data.map(d => d['Breed Name']))
        .range(colorPalette);

    // Add borough title
    container.append("h2")
        .text(borough)
        .style("font-size", "0.9rem")
        .style("font-weight", "bold");

    // Create SVG
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Prepare data for pie chart
    const pie = d3.pie().value(d => d.Count);
    const dataReady = pie(data);

    // Arc generator
    const arc = d3.arc()
    .innerRadius(radius * 0.5)
    .outerRadius(radius * 0.9);

    // Tooltip
const tooltip = d3.select("#tooltip");

// Draw pie slices
svg.selectAll("path")
.data(dataReady)
.join("path")
.attr("d", arc)
.attr("fill", d => colorScale(d.data['Breed Name']))
.attr("stroke", "#fff")
.style("stroke-width", "2px")
.on("mouseover", function(event, d) {
    tooltip.style("visibility", "visible")
        .text(`${d.data['Breed Name']}: ${d.data.Count} dogs`);
    d3.select(this).style("opacity", 0.7);
})
.on("mouseout", function() {
    tooltip.style("visibility", "hidden");
    d3.select(this).style("opacity", 1);
});


    // Add labels
    svg.selectAll("text")
        .data(dataReady)
        .join("text")
        .text(d => d.data['Breed Name'])
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .style("text-anchor", "middle")
        .style("font-size", "10px");
}
