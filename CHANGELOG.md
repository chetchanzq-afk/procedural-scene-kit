# Changelog

遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [0.1.0] - 2026-11-11

### Added

- 代码建模 DSL：`box / rbox / cyl / tube / plane / decal / label`，支持局部坐标系与碰撞盒
- 静态合批与索引归一化（`safeMerge`），失败时抛出明确错误
- 程序化材质：世界坐标污渍、面板分缝、边缘磨损、三平面细节贴图
- 贴花图集：箱号、警示、锈迹、标语（Canvas 生成）
- 后处理管线：SSAO、运动模糊、Bloom、屏幕空间体积光、AgX、镜头脏污、色差、暗角、颗粒、FXAA、自动曝光
- 湿地面平面反射（镜像相机 + 半分辨率）
- 体积光片（additive 光锥）
- 天气：实例化雨丝
- 画质四档 + 帧时闭环动态分辨率
- 室内示例与港区示例
- QA 钩子：`__stats()`、`?shot`、`?spin`、`?show`
- 技能文档：规格、建模、材质、光照、性能、配方、迭代、自动生成

### Known Limitations

- 体积雾易发白，默认关闭，需要按场景调参
- 不支持角色、植被、有机体
- 依赖运行期生成，显存与三角面预算需按档位控制
