function printReport(pages) {
    const entries = Object.entries(pages).sort((a, b) => b[1] - a[1]).map(([a, b]) => `Found ${b} internal links to ${a}`)
    entries.forEach(entry => {
        console.log(entry)
    })
}
export {printReport}