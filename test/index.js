///<reference types="@i3yun/viewer" />
//初始化资源
Sippreep.Initializer().then(() => {
    let viewer_element = document.getElementById('viewer-element');
    //创建3D视图
    let viewer = new Sippreep.Viewing.Viewer3D(viewer_element);
    //启动并检查WebGL
    const errorCode = viewer.start();
    if (errorCode > 0) {
        console.error('Failed to create a Viewer: WebGL not supported.');
        return;
    }
    //设置光影效果
    viewer.setLightPreset(4);
    /**
     * 应用数据
     */
    let funsData = {
        modelUrls: ['https://www.aisanwei.cn/api/Storge/Viewable?ID=jobs/525b8525-df81-4a65-9a97-f0197ac9c7c3/output/main.hf'//模型1
            , 'https://www.aisanwei.cn/api/Storge/Viewable?ID=jobs/dc6803f8-6871-4adf-98b6-4a508f5aa6ba/output/main.hf'//模型2
        ],
        //当前模型索引
        modelUrlIndex: -1,
        //定位聚焦对象集合
        focusedDbids: [],
        //颜色集合
        colors: [new THREE.Vector4(1, 0, 0, 1)//红
            , new THREE.Vector4(0, 1, 0, 1)//绿
            , new THREE.Vector4(0, 0, 1, 1)//蓝
        ],
        //当前颜色索引
        colorIndex: -1,
        //视角集合
        viewStates: [],
        //当前视角索引
        viewStateIndex: -1,
        //分组依据
        groupAttr:"类别"
    }
    //应用功能
    let funcs = {
        "切换场景": () => {
            funsData.modelUrlIndex = helperFuncs.getNextIndex(funsData.modelUrlIndex, funsData.modelUrls);

            //清除旧模型
            if (viewer.model)
                viewer.unloadModel(viewer.model);
            //加载新模型
            viewer.loadModel(funsData.modelUrls[funsData.modelUrlIndex], { globalOffset: { x: 0, y: 0, z: 0 } }, (m) => {
                alert("加载模型成功(左键旋转，中键平移，中键滚动缩放)");
            }, (e) => {
                alert("加载模型失败");
            });
        },
        "选中事件订阅": () => {
            if (!funcs.onSelectionChanged) {
                funcs.onSelectionChanged = () => {
                    let dbids = viewer.getSelection();
                    if (dbids.length > 0) {
                        viewer.getProperties(dbids[0], (r) => {

                            alert(`选中对象:"${r.name}"\ndbid(自增id):"${dbids[0]}"\nexternalId(uuid):"${r.externalId}"`);
                        })
                    }
                }
                //订阅选中项改变事件
                viewer.addEventListener(Sippreep.Viewing.SELECTION_CHANGED_EVENT, funcs.onSelectionChanged);

            }
            alert("选中事件订阅成功,请尝试选中对象（设备）");
        },
        "选中事件取消": () => {
            if (funcs.onSelectionChanged) {
                //取消订阅选中项改变事件
                viewer.removeEventListener(Sippreep.Viewing.SELECTION_CHANGED_EVENT, funcs.onSelectionChanged);
                funcs.onSelectionChanged = null;
            }
            alert("选中事件清除成功");
        },
        "定位聚焦对象组": async () => {
            if (!viewer.model) {
                alert("请先切换场景");
                return;
            }
            /**
             * 加载扩展(模型筛选器)
             * @type Sippreep.Extensions.ModelFilter.ModelFilterExtension
             */
            let filter = await viewer.loadExtension("Sippreep.Extensions.ModelFilter.ModelFilterExtension");
            /**
             * 按类别分组对象
             */
            let values = await filter.listPropertyValueWithObjectId(funsData.groupAttr);
            /**
             * 随机获取一个分组
             */
            let randomValue = helperFuncs.getRandomValue([...values.keys()]);
            let dbids = values.get(randomValue);

            funsData.focusedDbids = dbids;
            //隔离对象
            viewer.isolate(funsData.focusedDbids);
            //聚焦视角
            viewer.fitToView(dbids);
            //选中对象
            //viewer.select(dbids);
        },
        "定位聚焦对象": () => {
            if (funsData.focusedDbids.length == 0) {
                alert("请先定位聚焦对象组");
                return;
            }
            //随机获取一个对象
            let dbids = [helperFuncs.getRandomValue(funsData.focusedDbids)];
            
            //聚焦视角
            viewer.fitToView(dbids);
            //选中对象
            //viewer.select(dbids);
        },
        "定位聚焦清除": () => {
            funsData.focusedDbids = [];
            //取消隔离
            viewer.isolate([]);
            //全局视角
            viewer.fitToView([]);
            //取消选中
            //viewer.select([]);
        },
        "对象颜色设置": () => {
            if (funsData.focusedDbids.length == 0) {
                alert("请先定位聚焦对象");
                return;
            }
            if (funsData.colors.length == 0) {
                alert("请先配置颜色");
                return;
            }

            funsData.colorIndex = helperFuncs.getNextIndex(funsData.colorIndex, funsData.colors);
            funsData.focusedDbids.forEach(dbid => {
                viewer.setThemingColor(dbid, funsData.colors[funsData.colorIndex]);
            });

            viewer.fitToView(funsData.focusedDbids);
        },
        "对象颜色清除": () => {
            //清除颜色
            viewer.clearThemingColors();
        },
        "视角添加": () => {
            if (!viewer.model) {
                alert("请先切换场景");
                return;
            }
            funsData.viewStates.push(viewer.getState({ viewport: true }));
            alert(`添加视角成功(${funsData.viewStates.length}).`);
        },
        "视角切换": () => {
            if (funsData.viewStates.length == 0) {
                alert("请先添加视角");
                return;
            }

            funsData.viewStateIndex = helperFuncs.getNextIndex(funsData.viewStateIndex, funsData.viewStates);
            viewer.restoreState(funsData.viewStates[funsData.viewStateIndex]);

            // if (funsData.viewStateIndex == funsData.viewStates.length-1)
            //     alert("已到集合结尾");
        }
    }
    //辅助工具
    let helperFuncs = {
        showGUI: () => {
            //GUI显示
            var allGui = new dat.GUI({
                closeOnTop: true
            });
            allGui.domElement.parentNode.style.zIndex = '1';
            for (let name in funcs) {
                allGui.add(funcs, name);
            }
        },
        getNextIndex:(index, array) => {
            let i = index;
            i++;
            if (i >= array.length) {
                return 0;
            }
            else {
                return i;
            }
        },
        getRandomValue: (array) => {
            return array[Math.round(array.length * Math.random())];
        }
    }
    helperFuncs.showGUI();
});
