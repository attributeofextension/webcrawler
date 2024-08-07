import { JSDOM } from 'jsdom';

function getURLsFromHTML(html_string, baseURL) {
    const dom = new JSDOM(html_string);
    const links = dom.window.document.querySelectorAll("a")
    const urls = []
    for (let i = 0; i < links.length; i++) {
        urls.push(links[i].getAttribute("href"));
    }
    return urls
}

function getURLStringNoProtocol(url) {
    const urlObject = new URL(url)
    let pathname = urlObject.pathname

    while (pathname.length > 0 && pathname.endsWith("/")) {
        pathname = pathname.substring(0, pathname.length - 1);
    }
    return `${urlObject.hostname}${pathname}`
}

function addPathnameToBaseURL(baseURL, pathname) {
    const urlObject = new URL(pathname, baseURL);
    return urlObject.toString()
}

function isRelativeLink(url) {
    const urlObject = new URL(url, "relative://")
    return urlObject.protocol === "relative:" && url === `${urlObject.pathname}${urlObject.search}${urlObject.hash}`
}

function addLinkToPages(baseURL, link, pages = {}) {
    link = addPathnameToBaseURL(baseURL, link)
    link = getURLStringNoProtocol(link)
    if (!pages[link]) {
        pages[link] = 0;
    }
    pages[link]++
}

function crawlPage(baseURL, currentURL=baseURL, pages = {}, alreadyCrawledOrCurrentlyCrawling = []) {
    if(alreadyCrawledOrCurrentlyCrawling.findIndex(url => getURLStringNoProtocol(currentURL) === url) > -1) {
        return Promise.resolve([false, `Already crawled ${getURLStringNoProtocol(currentURL)}`])
    }

    return new Promise((resolve, reject) => {
        fetch(currentURL).then(response => {
            if (!response.ok) {
                // resolve with [false, error message] because reject or throwing an exception will halt promise.all
                resolve([false, `Could not crawl page at ${getURLStringNoProtocol(currentURL)} because ${response.statusText}`]);
            } else if (!response.headers.get("content-type") || !response.headers.get("content-type").startsWith("text/html")) {
                // resolve with [false, error message] because reject or throwing an exception will halt promise.all
                resolve([false, `Could not crawl page at ${getURLStringNoProtocol(currentURL)} since page was content-type "${response.headers.get("content-type")}", not "text/html"`]);
            } else {
                response.text().then(html => {
                    const links = getURLsFromHTML(html)
                        .filter(link => {
                            try {
                                return isRelativeLink(link)
                            } catch (e) {
                                return false
                            }
                        })
                        .filter(link => {
                            try {
                                addLinkToPages(baseURL, link)
                                return true
                            } catch (e) {
                                return false
                            }
                        })
                    if (links.length === 0) {
                        resolve([true, `No links found at ${getURLStringNoProtocol(currentURL)}`])
                    }
                    for (let link of links) {
                        addLinkToPages(baseURL, link, pages)
                    }

                    alreadyCrawledOrCurrentlyCrawling.push(getURLStringNoProtocol(currentURL))
                    Promise.all(links.map(link => crawlPage(baseURL, addPathnameToBaseURL(baseURL, link), pages, alreadyCrawledOrCurrentlyCrawling))).then(results => {
                        resolve([true, `Successfully crawled all links at ${getURLStringNoProtocol(currentURL)}`])
                    })

                })
            }
        })
    })
}

export { getURLsFromHTML, crawlPage, isRelativeLink, getURLStringNoProtocol, addPathnameToBaseURL, addLinkToPages }