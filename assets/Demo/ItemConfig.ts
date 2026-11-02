export interface ItemConfig   {
    readonly itemId: string;
    readonly displayName: string;
    readonly price: number;
}
export const ITEM_CONFIGS   : readonly ItemConfig[] = [
    // 填写配置记录
    {
        itemId: "potion",
        displayName: "药水",
        price: 10,
    },
    {
        itemId: "gem",
        displayName: "宝石",
        price: 20,
    },
    {
        itemId: "ticket",
        displayName: "门票",
        price: 5,
    }
];

export function getItemConfig(itemId:string):ItemConfig | null{

    for (const config of ITEM_CONFIGS) {
        if (config.itemId === itemId) {
            return config
        }
    }

    console.warn("找不到物品配置", itemId);
    return null;
}
