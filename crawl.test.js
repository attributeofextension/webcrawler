import { jest, test, expect } from "@jest/globals"
import { getURLsFromHTML, isRelativeLink, getURLStringNoProtocol, addPathnameToBaseURL, crawlPage } from "./crawl.js"
import * as url from "node:url";
import {argv} from "node:process";


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

global.fetch = jest.fn((url) => {
    let responseKey = url
    while(responseKey.endsWith("/")) {
        responseKey = responseKey.substring(0, url.length - 1)
    }

    const responses = {
        "http://www.crawler-test.com": Promise.resolve({
            ok: true,
            headers: {
                get: () => "text/html; charset=utf-8"
            },
            text: () => Promise.resolve("<html><body><a href='/one'>one</a><a href='/two/'>two</a><a href='/three/four'>four</a><a href='https://www.external-test.com'>external</a></body></html>")
        }),
        "http://www.crawler-test.com/one": Promise.resolve({
            ok: true,
            headers: {
                get: (key) => "text/html; charset=utf-8"
            },
            text: () => Promise.resolve("<html><body><a href='/'>home</a><a href='/one/five'>one</a></body></html>")
        }),
        "http://www.crawler-test.com/one/five": Promise.resolve({
            ok: false,
            headers: {get: (key) => "" },
            text: () => Promise.resolve("")
        }),
        "http://www.crawler-test.com/two": Promise.resolve({
            ok: true,
            headers: { get: (key) => "text/html; charset=utf-8" },
            text: () => Promise.resolve("<html><body><a href='/'>home</a><a href='/two/six'>six</a></body>")
        }),
        "http://www.crawler-test.com/two/six": Promise.resolve({
            ok: true,
            headers: { get: (key) => "application/xml; charset=utf-8" },
            text: () => Promise.resolve(`<xml xmlns="http://www.w3.org/1999/xhtml" xmlns="http://www.w3.org/2000/svg>`)
        }),
        "http://www.crawler-test.com/three": Promise.resolve({
            ok: true,
            headers: { get: (key) => "text/html; charset=utf-8" },
            text: () => Promise.resolve("<html><body><a href='/'>home</a><a href='/three/four'>four</a></body></html>")
        }),
        "http://www.crawler-test.com/three/four": Promise.resolve({
            ok: true,
            headers: { get: (key) => "text/html; charset=utf-8" },
            text: () => Promise.resolve("<html><body><a href='/'>home</a><a href='/three'>three</a></body>")
        }),
        "http://www.crawler-test.com/disconnected": Promise.resolve({
            ok: true,
            headers: { get: (key) => "text/html; charset=utf-8" },
            text: () => Promise.resolve("<html><body><a href='/'>home</a></body></html>")
        })
    }
    if(!responses[responseKey]) {
        throw Error("Crawler did something unexpected, looking for url: " + responseKey)
    }

    return responses[responseKey]
})
test("test crawlPage with fetch mock", () => {
    const pages = {}
    const alreadyCrawledOrCrawling = []
    crawlPage("http://www.crawler-test.com", "http://www.crawler-test.com", pages, alreadyCrawledOrCrawling).then(([success, message]) => {
        expect(success).toEqual(true)
        expect(message).toEqual(`Successfully crawled all links at www.crawler-test.com`)
        expect(pages).toEqual({
            "www.crawler-test.com": 4,
            "www.crawler-test.com/one": 1,
            "www.crawler-test.com/two": 1,
            "www.crawler-test.com/three": 1,
            "www.crawler-test.com/three/four": 2,
            "www.crawler-test.com/one/five": 1,
            "www.crawler-test.com/two/six": 1
        })
        expect(Object.keys(pages)).not.toContain("www.crawler-test.com/disconnected")
        expect(global.fetch).toHaveBeenCalledTimes(7)
    })
})
