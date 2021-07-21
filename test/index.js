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
    /**
     * 应用数据
     */
    let funsData = {
        modelUrls: ['http://api.aisanwei.cn/api/Storge/Viewable?ID=jobs/525b8525-df81-4a65-9a97-f0197ac9c7c3/output/main.hf'//模型1
            , 'http://api.aisanwei.cn/api/Storge/Viewable?ID=jobs/dc6803f8-6871-4adf-98b6-4a508f5aa6ba/output/main.hf'//模型2
        ],
        //当前模型索引
        modelUrlIndex: 0,
        //定位聚焦对象集合
        focusedDbids: [],
        //颜色集合
        colors: [new THREE.Vector4(1, 0, 0, 1)//红
            , new THREE.Vector4(0, 1, 0, 1)//绿
            , new THREE.Vector4(0, 0, 1, 1)//蓝
        ],
        //当前颜色索引
        colorIndex: 0,
        //视角集合
        viewStates: [],
        //当前视角索引
        viewStateIndex: 0,
    }
    //应用功能
    let funcs = {
        "切换场景": () => {
            funsData.modelUrlIndex = helperFuncs.getSafeIndex(funsData.modelUrlIndex, funsData.modelUrls);

            //清除旧模型
            if (viewer.model)
                viewer.unloadModel(viewer.model);
            //加载新模型
            viewer.loadModel(funsData.modelUrls[funsData.modelUrlIndex], { globalOffset: { x: 0, y: 0, z: 0 } }, (m) => {
                alert("加载模型成功(左键旋转，中键平移，中键滚动缩放)");
            }, (e) => {
                alert("加载模型失败");
            });

            funsData.modelUrlIndex++;
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
        "定位聚焦对象": () => {
            if (!viewer.model) {
                alert("请先切换场景");
                return;
            }
            viewer.model.getExternalIdMapping((idMapping) => {
                //获取所有对象
                let allDbids = Object.values(idMapping);
                let dbids = [helperFuncs.getRandomValue(allDbids)];

                funsData.focusedDbids.push(...dbids);
                //隔离对象
                viewer.isolate(funsData.focusedDbids);
                //聚焦视角
                viewer.fitToView(dbids);
                //选中对象
                //viewer.select(dbids);
            });
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

            funsData.colorIndex = helperFuncs.getSafeIndex(funsData.colorIndex, funsData.colors);
            funsData.focusedDbids.forEach(dbid => {
                viewer.setThemingColor(dbid, funsData.colors[funsData.colorIndex]);
            });
            funsData.colorIndex++;

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
            funsData.viewStateIndex = helperFuncs.getSafeIndex(funsData.viewStateIndex, funsData.viewStates);
            viewer.restoreState(funsData.viewStates[funsData.viewStateIndex]);
            funsData.viewStateIndex++;

            if (funsData.viewStateIndex + 1 == funsData.viewStates.length)
                alert("已到集合结尾");
        }
    }
    //应用辅助
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
        getSafeIndex: (index, array) => {
            if (index >= array.length) {
                return 0;
            }
            else {
                return index;
            }
        },
        getRandomValue: (array) => {
            return array[Math.round(array.length * Math.random())];
        }
    }
    helperFuncs.showGUI();
});