

export enum Macro{
    /**@description 未知 */
    UNKNOWN = "UNKNOWN",

    /**@description 主包bundle名 */
    BUNDLE_RESOURCES = 'resources',
    /**@description 主子包主代码*/
    BUNDLE_GSCRIPT = 'GScript',

    /**@description 远程资源包bundle名 */
    BUNDLE_REMOTE = "Remote",
}

export enum AssLoaderTag{
    //spriteframe
    SpFrame = 'res_SpriteUrl',
    //骨骼
    SpSkeData = 'res_SkeletonLoaderKey',
    //prefab
    Prefab = 'res_Prefab',
    //Prefab3dTUI
    Prefab3dTUI = 'res_Prefab3dTUI'
}

/**
     * @description 界面视图状态
     */
export enum ViewStatus {
    /**@description 无状态 */
    NONE,   
    /**@description 加载*/
    LOADING,        
    /**@description 打开*/
    SHOWING,
    /**@description 关闭*/
    CLOSEING,
    SHOWED,
}