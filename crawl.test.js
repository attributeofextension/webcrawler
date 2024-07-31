import { jest, test, expect } from "@jest/globals"
import { getURLsFromHTML, isRelativeLink, getURLStringNoProtocol, addPathnameToBaseURL } from "./crawl.js"
import * as url from "node:url";


test.each([
    { url: "http://www.crawler-test.com/one", expected: false },
    { url: "two", expected: false },
    { url: "/three", expected: true },
    { url: "/four?five#six", expected: true },
    { url: "/seven/?eight#nine", expected: true },
])("testing isRelativeLink with $url, expecting: $expected", ({ url, expected }) => {
    expect(isRelativeLink(url)).toBe(expected);
    if (isRelativeLink(url)) {
        const baseURL = "resolved://base.test"
        expect((new URL(url, baseURL)).toString()).toEqual(baseURL + url)
    }
})
test.each([
    { url: "http://www.crawler-test.com/", expected: "www.crawler-test.com" },
    { url: "http://www.crawler-test.com/one", expected: "www.crawler-test.com/one" },
    { url: "https://www.crawler-test.com/two/", expected: "www.crawler-test.com/two" },
    { url: "http://www.crawler-test.com/three//", expected: "www.crawler-test.com/three" },
    { url: "http://www.crawler-test.com/four?five#six", expected: "www.crawler-test.com/four" },
])("testing getURLStringNoProtocol with $url, expecting: $expected", ({ url, expected }) => {
    expect(getURLStringNoProtocol(url)).toEqual(expected)
})

test.each([
    { baseURL: "http://www.crawler-test.com", pathname: "/one", expected: "http://www.crawler-test.com/one" },
    { baseURL: "https://www.crawler-test.com", pathname: "/two/", expected: "https://www.crawler-test.com/two/" },
    { baseURL: "http://www.crawler-test.com", pathname: "/three//", expected: "http://www.crawler-test.com/three//" },
    { baseURL: "https://www.crawler-test.com", pathname: "/four?five#six", expected: "https://www.crawler-test.com/four?five#six" },
    { baseURL: "http://www.crawler-test.com/", pathname: "/seven", expected: "http://www.crawler-test.com/seven" },
    { baseURL: "http://www.crawler-test.com", pathname: "eight", expected: "http://www.crawler-test.com/eight" },
])("testing addPathnameToBaseURL with $baseURL and $pathname, expecting: $expected", ({ baseURL, pathname, expected}) => {
    expect(addPathnameToBaseURL(baseURL, pathname)).toEqual(expected)
})

test.each([
    {   htmlString: "<body><a href='/one'>one</a><a href='/two'>two</a><a href='http://three.com/three'>three</a></body>",
        baseUrl: "base.dev",
        expected: [ "/one", "/two", "http://three.com/three"]
    },
])("testing getURLsFromHTML with htmlString:'\n $htmlString \n for baseURL: $baseUrl\nexpecting: $expected\n",({htmlString, baseUrl, expected }) => {
    expect(getURLsFromHTML(htmlString, baseUrl)).toEqual(expected)
})

