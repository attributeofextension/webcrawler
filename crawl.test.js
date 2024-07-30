import { jest, test, expect } from "@jest/globals"
import { normalizeURL, getURLsFromHTML, isRelativeLink } from "./crawl.js"


test.each([
    { url: "http://blog.boot.dev/one", expected: false },
    { url: "two", expected: false },
    { url: "/three", expected: true },
    { url: "/four?five#six", expected: true },
    { url: "/seven/?eight#nine", expected: true },
])("testing isRelativeLink with $link, expecting: $expected", ({ url, expected }) => {
    expect(isRelativeLink(url)).toBe(expected);
    if (isRelativeLink(url)) {
        const baseURL = "resolved://base.test"
        expect((new URL(url, baseURL)).toString()).toEqual(baseURL + url)
    }
})

// test.each([
//     { url: "https://blog.boot.dev/path/", link: "/path", expected: "blog.boot.dev/path" },
//     { url: "https://blog.boot.dev/path", link: "/path", expected: "blog.boot.dev/path" },
//     { url: "http://blog.boot.dev/path/", link: "/path/", expected: "blog.boot.dev/path" },
//     { url: "http://blog.boot.dev/path", link: "/path", expected: "blog.boot.dev/path" },
// ])("testing normalizeURL with url: $url, link: $link and expecting: $expected", ({url, link, expected}) => {
//     expect(normalizeURL(url,link)).toBe(expected)
// })
test.each([
    {   htmlString: "<body><a href='/one'>one</a><a href='/two'>two</a><a href='http://three.com/three'>three</a></body>",
        baseUrl: "base.dev",
        expected: [ "/one", "/two", "http://three.com/three"]
    },
])("testing getURLsFromHTML with htmlString:'\n $htmlString \n for baseURL: $baseUrl\nexpecting: $expected\n",({htmlString, baseUrl, expected }) => {
    expect(getURLsFromHTML(htmlString, baseUrl)).toEqual(expected)
})

