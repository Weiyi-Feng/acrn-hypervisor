import {createSearchParams, useLocation} from "react-router-dom";
import {path} from "@tauri-apps/api";


export function unique(arr) {
    return Array.from(new Set(arr))
}

export function getURLParam(key) {
    const location = useLocation()
    const searchParams = new URLSearchParams(location.search)
    return searchParams.get(key);
}

export function buildPageParams(url, queryParams = {}) {
    let data = {pathname: url}
    if (queryParams) {
        data.search = createSearchParams(queryParams).toString()
    }
    return data;
}

export async function resolveHome(filepath) {
    if (filepath[0] === '~') {
        return path.join(await path.homeDir(), filepath.slice(1))
    }
    return filepath;
}