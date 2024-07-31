import { argv } from "node:process"
import { crawlPage } from "./crawl.js"
import { printReport} from "./report.js";

function main() {
    const error_message = "Usage: npm run start [baseURL]"
    if (argv.length >= 3) {
        console.log("Beginning crawl at " + argv[2])
        let pages = {}
        crawlPage(argv[2], argv[2], pages).then(result => {
            if( result.length === 2 && !result[0]) {
                console.error(`BaseURL ${argv[2]} could not be crawled`)
                console.error(result[1])
                process.exit(1)
            } else if (result.length === 2) {
                console.log(`Crawl of ${argv[2]} complete!`)
                console.log("Here are the results:")
                printReport(pages)
                process.exit(0)
            } else {
                console.error(`The crawlPage Promise returned a result in the incorrect format! ${result}`)
                process.exit(1)
            }
        }).catch(err => {
            console.error(`An unexpected error occurred: ${err}`)
            process.exit(1)
        })
    } else {
        console.error(error_message)
        return 1
    }
}

main()