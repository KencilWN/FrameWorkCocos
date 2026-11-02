import { sys } from "cc";

export class LocalStorage  {
    public getItem(key:string):unknown
    {
        try {
            const text = sys.localStorage.getItem(key);

            if(text === null)
            {
                return null;
            }
            return JSON.parse(text);
        }
        catch(e)
        {
            console.error('LocalStorage.getItem error:',key, e);
            return null;
        }
    }

    public setItem(key:string, data:unknown):boolean
    {
        try {
            const text = JSON.stringify(data);
            if(typeof text !== "string")
            {
                return false;
            }
            sys.localStorage.setItem(key, text);
        }
        catch(e)
        {
            console.error('LocalStorage.setItem error:',key, e);
            return false;
        }
        return true;
    }

    public removeItem(key:string):boolean
    {
        try {
            sys.localStorage.removeItem(key);
        }
        catch(e)
        {
            console.error('LocalStorage.removeItem error:',key, e);
            return false;
        }
        return true;
    }
}

