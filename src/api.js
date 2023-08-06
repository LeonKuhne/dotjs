export class API {
  static fetch(url, method='GET', body=undefined) {
    const xhr = new XMLHttpRequest()
    xhr.open(method, url, false)
    xhr.send(body)
    if (xhr.status != 200) {
      throw Error(`Could not load shader: ${url}`)
    }
    return xhr.responseText
  }
}