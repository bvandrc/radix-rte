import { isEditorHtml, isHtmlMarkup, toEditorContent } from '../html'

describe('isHtmlMarkup', () => {
  it.each([
    ['<p>hello</p>', true],
    ['<table><tr><td>a</td></tr></table>', true],
    ['  <p>leading and trailing space</p>  ', true],
    ['<br/>', false], // self-closing only: never closes on a closing tag
    ['<3 you', false],
    ['I used a <table> once', false],
    ['<ul> means unordered list', false],
    ['<p>unclosed', false],
    ['', false],
  ])('%j → %s', (value, expected) => {
    expect(isHtmlMarkup(value)).toBe(expected)
  })
})

describe('isEditorHtml', () => {
  it.each([
    ['<p>prose</p>', true],
    ['<ul><li>one</li></ul>', true],
    ['<ol><li>one</li></ol>', true],
    ['<pre><code>x</code></pre>', true],
    ['<table><tr><td>a</td></tr></table>', true],
    // Markup by `isHtmlMarkup`'s standard, but not a block the editor starts a
    // document with — so it stays plain text and gets escaped.
    ['<b>see below</b>', false],
    ['<div><p>wrapped</p></div>', false],
    ['<3 you', false],
  ])('%j → %s', (value, expected) => {
    expect(isEditorHtml(value)).toBe(expected)
  })
})

describe('toEditorContent', () => {
  it('leaves editor HTML alone', () => {
    expect(toEditorContent('<p>already rich</p>')).toBe('<p>already rich</p>')
  })

  it('wraps each line of a plain-text value in its own paragraph', () => {
    expect(toEditorContent('one\ntwo')).toBe('<p>one</p><p>two</p>')
  })

  it('escapes markup in a plain-text value rather than adopting it', () => {
    expect(toEditorContent('<b>see below</b>')).toBe(
      '<p>&lt;b&gt;see below&lt;/b&gt;</p>'
    )
  })

  it('is idempotent — a converted value reads back as editor HTML', () => {
    const once = toEditorContent('<3 you')
    expect(toEditorContent(once)).toBe(once)
  })

  it.each([null, ''])('reads %j as empty', (value) => {
    expect(toEditorContent(value)).toBe('')
  })
})
