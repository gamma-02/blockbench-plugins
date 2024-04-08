/**
MIT License

Copyright (c) 2022 JTK222

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
**/

/**
 * Big thanks to JTK222 for helping with this and allowing usage of mod_utils' code!
 */
( function () {

    
    


    

    // var importPoseList = new Action({
    //     id: 'import_pose_list',
    //     name: 'Import Pose List (.json)',
    //     icon: 'flip_to_back',
    //     description: 'Import a list of poses for animations',
    //     category: 'file',
    //     condition: () => Format.id === Formats.modded_entity.id,
    //     click: function (event){
    //         loadTabulaModelList();
    //     }
    // })

    animations = ["idle", "attacking", "injured", "head_cocking", "calling", "hissing", "pouncing", "sniffing", "eating", "drinking", "mating", "sleeping", "resting", "roaring", "speak", "looking_left", "looking_right", "begging", "looking_for_fish", "snap", "dying", "scratching", "spitting", "pecking", "preening", "tail_display", "rearing_up", "laying_egg", "giving_birth", "gestated", "gliding", "on_land", "walking", "jumping", "running", "swimming", "flying", "climbing", "prepare_leap", "leap", "leap_land", "start_climbing", "dilophosaurus_spit", "fish_looking", "attack_landing"];
    
    


    async function loadTabulaModelList(){
        var loadedPoseMap = new Map();
        var loadedAnimationMap = new Map();
        var animationMap = new Map();
        var animations;
        var poses;

        var cont = false;


        Undo.initEdit({outliner: true});


        var files;

        var filesExists = false;

        Blockbench.import({
            type: 'json File',
            extensions: ['json'],
            readtype: 'text',
        }, (inputJsonFile) => {
            files = inputJsonFile;
            filesExists = true;
        });
        let iterationEscapeCounter = 0
        while(!filesExists && iterationEscapeCounter < 10000000){iterationEscapeCounter++}
        console.log("Files:");
        console.log(files);

        

        animations = JSON.parse(files[0].content);
            poses = animations.poses;
            for(var key in poses){
                animationMap.set(key, poses[key]);
            }
            
            //<string, Group>
            

            var path = files[0].path
            console.log(path);

            var splitIndex = path.lastIndexOf('\\');
            const splitPath = path.substring(0, splitIndex) + '\\';
            console.log(splitPath);
            for(let [key, value] of animationMap){
                
                console.log(value);
                let animationPoses = []

                for(let i = 0; i < value.length; i++){
                    let file = splitPath + value[i].pose + ".tbl";
                    let importType = ImportTypeEnum.TBL;
                    var cont1 = false;

                    var tblFile;
                    
                    Blockbench.readFile(file, {readtype: 'binary', errorbox: false}, (tblFiles) => {
                        tblFile = tblFiles
                        cont1 = true;

                    });

                    while(!cont1){}

                    let data = tblFile[0].content;
                    // console.log(tblFile[0].content);

                    console.log("awaiting zip loading??");
                    var await1 = new JSZip().loadAsync(data);
                    
                    await await1.then(async zip => {  
                        console.log("Zipped! ");
                        // console.log(zip);
                        var something = zip.file(importType.file).async("string");
                        
                        await something.then(json => {
                            console.log("group:");
                            // console.log(json);
                            // console.log(importType);
                            let keyframePose = importType.import(json);

                            //Make the bones compliant with Java lmao
                            unDuplicateBones(keyframePose);

                            // keyframePose = false;
                            loadedPoseMap.set(value[i].pose, keyframePose);

                        
                            animationPoses[i] = {pose: keyframePose, time: value[i].time, animation: key};

                            console.log(animationPoses[i]);
                        });
                    });
                    
                }

                b = 0;

                for(i = 0; i < animationPoses.length; i++){
                    let a = animationPoses[i];
                    console.log(a);
                    b += a.time;
                }

                // for(let a in animationPoses){
                    
                //     b += a.time;
                // }
                
                console.log("animationLength: " + b);
                console.log(key);
                loadedAnimationMap.set(key, {poses: animationPoses, animationLength: b});
            

            }



            console.log("Finished awaiting BlockBench readfile!");

            cont = true;

        if(!cont){
            console.log("agh what");
        }

        Undo.finishEdit('Import animation states', {outliner: true})


        console.log(loadedAnimationMap);


        console.log(loadedPoseMap);
        console.log(animationMap);

        console.log("Finished importing poses!");

        
        


        /**
         * Animation
         * -> Animator
         * --> Keyframe
         * 
         * Animation: name, type, loop mode, override, length, snapping, anim time update, blend weight(?), start delay, loop delay, Animators
         * Animators: uuid for each bone referrign to: name, type(same as Animation), [] of Keyframes
         * Keyframe: channel(transform type), data points {[]} x,y,z, uuid, time, color(?), interpolation, bezier linked, bezier handles(4xvec3)
         * 
         * woo hooo lets get coding!
         */

        /**
         * Four animations per animation:
         * 1: no transition from idle(ANIMATION_NAME_NO_TRANSITIONS)
         * 2: both in and out transition from and to idle(ANIMATION_NAME_BOTH_TRANSITIONS)
         * 3: transition in from idle, no transition out(ANIMATION_NAME_TRANSITION_IN_FROM_IDLE)
         * 4: no transition in from idle, transition out to idle(ANIMATION_NAME_TRANSITION_OUT_TO_IDLE)
         */

        let idleAnim = loadedAnimationMap.get("IDLE");

        console.log("IdleAnim");
        console.log(idleAnim);

        console.log("IdleAnimLength");
        console.log(idleAnim.animationLength);

        var idleAnimation = new Animation({
            name: "IDLE",
            loop: 'loop',
            override: 'true',
            length: idleAnim.animationLength,
            snapping: 24
        });
        
        let animTime = 0;
        for(let poseContainer of idleAnim.poses){

            let pose = poseContainer.pose;
            let time = poseContainer.time;
            let key = poseContainer.key;

            recursiveCreateKeyframe(idleAnimation, pose, animTime);

            // let rootUUID = guid();
            // let rootAnimatior = new BoneAnimator(rootUUID, idleAnimation, rootGroup.name);
            // let rootKeyframeOptions = make_Keyframe(rootGroup, time);
            // rootAnimatior.addKeyframe(rootKeyframeOptions.pos.keyframe, rootKeyframeOptions.pos.uuid);
            // rootAnimatior.addKeyframe(rootKeyframeOptions.rot.keyframe, rootKeyframeOptions.rot.uuid);
            // for(let group of pose.children){
            //     if(group instanceof Group){

            //     }
            // }
            animTime += time;
        }

        console.log(idleAnimation);



        // for(let [animationName, poseTimeList] of loadedAnimationMap){

        //     if(animationName.toLowerCase() == "idle")
        //         continue;


        //     //no transitions animation
        //     var noTransitionAnimation = new _Animation({
        //         name: animationName.toUpperCase() + "_NO_TRANSITIONS",
        //         loop: EntityAnimationEnum[animationName.toLowerCase()].hold ? 'hold' : 'loop',
        //         override: false,
        //         length: poseTimeList[0].animationLength,
        //         snapping: 24
        //     });

        //     var noTransitionAnimators = new Map();
            
        //     // let noTransitionRootAnimatorUUID = guid();
        //     // var noTransitionRootnimator = new BoneAnimator(noTransitionRootAnimatorUUID, noTransitionAnimation, "root");

        //     //both transition animation
        //     var bothTransitionAnimation = new _Animation({
        //         name: animationName.toUpperCase() + "_BOTH_TRANSITIONS",
        //         loop: EntityAnimationEnum[animationName.toLowerCase()].hold ? 'hold' : 'loop',
        //         override: false,
        //         length: poseTimeList[0].animationLength,
        //         snapping: 24
        //     });
                
        //     // let bothTransitionRootAnimatorUUID = guid();
        //     // var bothTransitionRooteAnimator = new BoneAnimator(bothTransitionRootAnimatorUUID, bothTransitionAnimation, "root");
            
        //     //transition in animation
        //     var transitionInFromIdleAnimation = new _Animation({
        //         name: animationName.toUpperCase() + "_TRANSITION_IN_FROM_IDLE",
        //         loop: EntityAnimationEnum[animationName.toLowerCase()].hold ? 'hold' : 'loop',
        //         override: false,
        //         length: poseTimeList[0].animationLength,
        //         snapping: 24
        //     });
            
        //     // let tranisitionInFromIdleRootAnimatorUUID = guid();
        //     // var tranisitionInFromIdleRootAnimator = new BoneAnimator(tranisitionInFromIdleRootAnimatorUUID, transitionInFromIdleAnimation, "root");
            

        //     //transition out animation
        //     var transitionOutToIdleAnimation = new _Animation({
        //         name: animationName.toUpperCase() + "_TRANSITION_OUT_TO_IDLE",
        //         loop: EntityAnimationEnum[animationName.toLowerCase()].hold ? 'hold' : 'loop',
        //         override: false,
        //         length: poseTimeList[0].animationLength,
        //         snapping: 24
        //     });
            
        //     // let tranisitionOutToIdleRootAnimatorUUID = guid();
        //     // var tranisitionOutToIdleRootAnimator = new BoneAnimator(tranisitionOutToIdleRootAnimatorUUID, transitionOutToIdleAnimation, "root");


        //     //do keyframes here!


            
            


        // }
    }


    function unDuplicateBones(group){
        const duplicates = []
        console.log(group);
        group.children.forEach(x => {
            if (duplicates.some(group => group.name === x.name)) {
                let duplicate = duplicates.find(group => group.name === x.name);
                x.name += "_" + duplicate.number;
                duplicate.number++;
            }
            else {
                duplicates.push({
                    name: x.name,
                    number: 1
                })
            }
        })
    }

    function recursiveCreateKeyframe(animation, rootGroup, keyframeTime){
        let rootUUID = guid();
        let rootAnimatior = new BoneAnimator(rootUUID, animation, rootGroup.name);
        let rootKeyframeOptions = make_Keyframe(rootGroup, keyframeTime);
        rootAnimatior.addKeyframe(rootKeyframeOptions.pos.keyframe, rootKeyframeOptions.pos.uuid);
        rootAnimatior.addKeyframe(rootKeyframeOptions.rot.keyframe, rootKeyframeOptions.rot.uuid);
        for(let group of rootGroup.children){
            if(group instanceof Group){
               internalRecursiveKeyframeMaker(rootGroup, keyframeTime, animation); 
            }
            console.log(group);
        }
        

    }


    function internalRecursiveKeyframeMaker(parent, keyframeTime, animation){
        let uuid = guid();
        let rootAnimatior = new BoneAnimator(uuid, animation, parent.name);
        let rootKeyframeOptions = make_Keyframe(parent, keyframeTime);
        rootAnimatior.addKeyframe(rootKeyframeOptions.pos.keyframe, rootKeyframeOptions.pos.uuid);
        rootAnimatior.addKeyframe(rootKeyframeOptions.rot.keyframe, rootKeyframeOptions.rot.uuid);
        for(let group of parent.children){
            if(group instanceof Group){
                internalRecursiveKeyframeMaker(group, keyframeTime, animation);
            }
        }

    }

    //this assumes that the group is a single bone
    function make_Keyframe(group, keyframeTimecode){
        let rotUUID = guid();
        var rotKeyframe = {
            channel: 'rotation',
            time: keyframeTimecode,
            color: -1,
            interpolation: 'catmullrom',
            data_points: [{"x": group.rotation[0], "y": group.rotation[1], "z": group.rotation[2]}]
        };
        let posUUID = guid()
        var posKeyframe = ({
            channel: 'position',
            time: keyframeTimecode,
            color: -1,
            interpolation: 'catmullrom',
            data_points: [{"x": group.origin[0], "y": group.origin[1], "z": group.origin[2]}]
        });

        return {pos: {keyframe: posKeyframe, uuid: posUUID}, rot: {keyframe: rotKeyframe, uuid: rotUUID}};



    }

    

var AxisEnum = {
	X: 0,
	Y: 1,
	Z: 2,
	size: 3,
	properties: {
		0: {name: "X-Axis", value: 0, code: "x"},
		1: {name: "Y-Axis", value: 1, code: "y"},
		2: {name: "Z-Axis", value: 2, code: "z"},
	}
}

    var Mappings = {
        mojmaps: {
            createCube: "Block.box",
            combine: "VoxelShapes.join",
            booleanFunction: "IBooleanFunction",
            key: "mod_utils.selected_mappings.mojmaps",
        },
        mcp: {
            createCube: "Block.makeCuboidShape",
            combine: "VoxelShapes.combineAndSimplify",
            booleanFunction: "IBooleanFunction",
            key: "mod_utils.selected_mappings.mcp",
        },
        yarn: {
            createCube: "Block.createCuboidShape",
            combine: "VoxelShapes.combineAndSimplify",
            booleanFunction: "BooleanBiFunction",
            key: "mod_utils.selected_mappings.yarn",
        },
        parchment: {
            createCube: "Block.box",
            combine: "Shapes.join",
            booleanFunction: "BooleanOp",
            key: "mod_utils.selected_mappings.parchment",
        },
    };

    var ImportTypeEnum = {
        TBL: {
            extension: 'tbl',
            file: 'model.json',
            texture: 'texture.png',
            import: loadTabulaModel
        },
        TBL2: {
            extension: 'tbl',
            file: 'model.json',
            texture: 'texture.png',
            import: null
        },
        TCN: {
            extension: 'tcn',
            file: 'model.xml',
            texture: /\.png/,
            import: loadTechneModel
        }
    }

    function loadTechneModel(data) {

        reader = new DOMParser();
        var xml = reader.parseFromString(data, "text/xml");
    
        var model = xml.getElementsByTagName("Model")[0];
        
        name = xml.getElementsByTagName("ProjectName")[0].childNodes[0].nodeValue;
        textureSizes = xml.getElementsByTagName("TextureSize")[0].childNodes[0].nodeValue;
    
        Project.name = name;
        Project.texture_width = textureSizes.slice(0, textureSizes.indexOf(","));
        Project.texture_height = textureSizes.slice(textureSizes.indexOf(",") + 1, textureSizes.length);
        
        var shapes = model.getElementsByTagName("Geometry")[0].getElementsByTagName("Shape");
        var rootGroup = new Group("root").addTo();
        rootGroup.init();
    
        for(var i = 0; i < shapes.length; i++){
            var shape = shapes[i];
            
            offset = JSON.parse("[" + shape.getElementsByTagName("Offset")[0].childNodes[0].nodeValue + "]");
            position = JSON.parse("[" + shape.getElementsByTagName("Position")[0].childNodes[0].nodeValue + "]");
            position[1] = 24 - position[1];
            rotation = JSON.parse("[" + shape.getElementsByTagName("Rotation")[0].childNodes[0].nodeValue + "]");
            size = JSON.parse("[" + shape.getElementsByTagName("Size")[0].childNodes[0].nodeValue + "]");
            uv = JSON.parse("[" + shape.getElementsByTagName("TextureOffset")[0].childNodes[0].nodeValue + "]");
            mirror = shape.getElementsByTagName("TextureOffset")[0].childNodes[0].nodeValue === "True";
            
            var group = new Group(
                {
                    name: shape.getAttribute("name"),
                    origin: [position[0], position[1], position[2]],
                    rotation: [-rotation[0], rotation[1], rotation[2]],
                }
            ).addTo(rootGroup);
            group.init();
            
            var cube = new Cube(
                {
                    mirror_uv: mirror,
                    name: shape.getAttribute("name"),
                    from: [position[0] + offset[0], position[1] - size[1] - offset[1], position[2] + offset[2]],
                    to: [position[0] + size[0] + offset[0], position[1] - offset[1], position[2] + offset[2] + size[2]],
                    uv_offset: [uv[0],  uv[1]],
                }
            ).addTo(group);
            cube.init();
        }
        Canvas.updateAll()
    }
    
    /** ---------- Import - Tabula ---------- */
    
    // var importTabula = new Action({
    //     id: 'import_tabula',
    //     name: "Import Tabula Model (.tbl)",
    //     icon: 'flip_to_back',
    //     description: 'Import a Tabula Model',
    //     category: 'file',
    //     condition: () => Format.id === Formats.modded_entity.id,
    //     click: function (event) {
    //         loadZipToJson(ImportTypeEnum.TBL);
    //     }
    // });
    
    function loadTabulaModel(data) {
        Undo.initEdit({
            outliner: true,
            bitmap: true,
            uv_mode: true
        });
        var json = JSON.parse(data);
        
        var version = json.projVersion || 0;
    
        switch(version){
            case 5:
                Project.texture_width = json.texWidth;
                Project.texture_height = json.texHeight;
                json.parts.forEach(part => readTblBone(part, version, null));
                Blockbench.showMessageBox({
                    title: "Warning",
                    message: "You imported a version 5 Tabula Model.\nThis Format has some functions which are not supported by Blockbench, for this reason some things might have broken on import."
                });
                break;
            default:
                Project.texture_width = json.textureWidth;
                Project.texture_height = json.textureHeight;
                var rootGroup = new Group(
                    {
                        name: "root",
                        origin: [0, 24, 0],
                        rotation: [0, 0, 0],
                    }
                ).addTo();
                rootGroup.init();
                json.cubes.forEach(cube => readTblBone(cube, version, rootGroup));
                return rootGroup;
        }
        
    
        Undo.finishEdit('Import Tabula Model', {
			outliner: true,
			bitmap: true,
			uv_mode: true,
		});
        Canvas.updateAll();
    }
    
    function readTblBone(json, version, parentGroup){
        var group;
        switch(version){
            case 5:
                group = new Group({
                    name: json.name,
                    origin: [(parentGroup == null ? 0 : parentGroup.origin[0]) + json.rotPX, (parentGroup == null ?  + 24 : parentGroup.origin[1]) - json.rotPY, (parentGroup == null ? 0 : parentGroup.origin[2]) + json.rotPZ],
                    rotation: [-json.rotAX, json.rotAY, -json.rotAZ],
                    visibility: false
                });
                break;
            case 2:
                group = new Group({
                    name: json.name,
                    origin: [parentGroup.origin[0] + json.position[0], parentGroup.origin[1] - json.position[1], parentGroup.origin[2] + json.position[2]],
                    rotation: [-json.rotation[0], json.rotation[1], -json.rotation[2]],
                    visibility: false
                });
                break;
            default:
                group = new Group({
                    name: json.name,
                    origin: [parentGroup.origin[0] + json.position[0], parentGroup.origin[1] - json.position[1], parentGroup.origin[2] + json.position[2]],
                    rotation: [-json.rotation[0], json.rotation[1], json.rotation[2]],
                    visibility: false
                });
                break;
        }
        if(parentGroup) group.addTo(parentGroup);
        group.init();
    
        switch(version){
            case 5:
                if(json.children) json.children.forEach(bone => readTblBone(bone, version, group));
                if(json.boxes) json.boxes.forEach(cube => readTblCube(cube, version, group, json));
                break;
            default:
                if(json.children) json.children.forEach(bone => readTblBone(bone, version, group));
                readTblCube(json, version, group);
                break;
        }
    }
    
    function readTblCube(json, version, parentGroup, extra){
        var cube;
        switch(version){
            case 5:
                var pos = [json.posX, json.posY, json.posZ];
                var dim = [json.dimX, json.dimY, json.dimZ];
                cube = new Cube({
                    mirror_uv: extra.mirror,
                    name: json.name,
                    from: [parentGroup.origin[0] + pos[0], parentGroup.origin[1] -  pos[1] - dim[1], parentGroup.origin[2] +  pos[2]],
                    to: [parentGroup.origin[0] + pos[0] + dim[0], parentGroup.origin[1] - pos[1], parentGroup.origin[2] +  pos[2] + dim[2]],
                    uv_offset: [extra.texOffX + json.texOffX, extra.texOffY + json.texOffY],
                    visibility: false
                });
                break;
            default:
                cube = new Cube({
                    mirror_uv: json.txMirror,
                    name: json.name,
                    from: [parentGroup.origin[0] + json.offset[0], parentGroup.origin[1] -  json.offset[1] - json.dimensions[1], parentGroup.origin[2] +  json.offset[2]],
                    to: [parentGroup.origin[0] + json.offset[0] + json.dimensions[0], parentGroup.origin[1] - json.offset[1], parentGroup.origin[2] +  json.offset[2] + json.dimensions[2]],
                    uv_offset: [json.txOffset[0],  json.txOffset[1]],
                    visibility: false
                });
                break;
        }
        if(parentGroup) cube.addTo(parentGroup);
        cube.init();
    }

    Plugin.register('tabula_pose_animations', {
        title: 'Tabula Pose Animations',
        author: 'gamma_02',
        description: 'Converts an animation json file specifying a list of models and their duration into keyframed animations',
        version: '1.0',
        variant: "desktop",
        about: 'idk',
        tags: ['Minecraft: Java Edition'],
        onload(){
            button =  new Action({
                id: 'import_pose_list',
                name: 'Import Pose List (.json)',
                icon: 'flip_to_back',
                description: 'Import a list of poses for animations',
                category: 'file',
                condition: () => Format.id === Formats.modded_entity.id,
                click: function (event){
                    loadTabulaModelList();
                }
            });
            MenuBar.addAction(button , 'file.import');
        },
        onunload(){
            button.delete();
        },
	    oninstall(){},
	    onuninstall() {}

    })

    /**
     * This stores things that need to be refrenced, mostly hold
     * Currently, useInertia is going to be used for keyframe type false = linear, true = smooth
     */
    EntityAnimationEnum = {
        idle: {
            hold: true,
            blockMovement: false,
            useInertia: false
        },
        attacking: {
            hold: false,
            blockMovement: false,
            useInertia: true
        },
        injured: {
            hold: false,
            blockMovement: false,
            useInertia: true
        },
        head_cocking: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        },
        calling: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        },
        hissing: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        },
        pouncing: {
            hold: false, 
            blockMovement: false, 
            useInertia: true
        },
        sniffing: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        },
        eating: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        },
        drinking: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        },
        mating: {
            hold: false, 
            blockMovement: false, 
            useInertia: true
        },
        sleeping: {
            hold: true, 
            blockMovement: false, 
            useInertia: true
        },
        resting: {
            hold: true, 
            blockMovement: false, 
            useInertia: true
        },
        roaring: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        },
        speak: {
            hold: false, 
            blockMovement: false, 
            useInertia: true
        },
        looking_left: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        },
        looking_right: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        },
        begging: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        },
        looking_for_fish: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        },
        snap: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        },
        dying: {
            hold: true, 
            blockMovement: false, 
            useInertia: false
        },
        scratching: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        },
        spitting: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        },
        pecking: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        },
        preening: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        },
        tail_display: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        },
        rearing_up: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        },
        laying_egg: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        },
        giving_birth: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        },
        gestated: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        },
        gliding: {
            hold: true, 
            blockMovement: false, 
            useInertia: true
        },
        on_land: {
            hold: false, 
            blockMovement: true, 
            useInertia: false
        },
        walking: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        },
        jumping: {
            hold: false, 
            blockMovement: false, 
            useInertia: false
        },
        running: {
            hold: false, 
            blockMovement: false, 
            useInertia: false
        },
        swimming: {
            hold: false, 
            blockMovement: false, 
            useInertia: false
        },
        flying: {
            hold: false, 
            blockMovement: false, 
            useInertia: false
        },
        climbing: {
            hold: false, 
            blockMovement: false, 
            useInertia: false
        },
        prepare_leap: {
            hold: false, 
            blockMovement: false, 
            useInertia: true
        },
        leap: {
            hold: false, 
            blockMovement: false, 
            useInertia: true
        },
        leap_land: {
            hold: false, 
            blockMovement: false, 
            useInertia: false
        },
        start_climbing: {
            hold: false, 
            blockMovement: false, 
            useInertia: true
        },
        dilophosaurus_spit: {
            hold: false, 
            blockMovement: false, 
            useInertia: true
        },
        fish_looking: {
            hold: false, 
            blockMovement: false, 
            useInertia: true
        },
        attack_landing: {
            hold: false, 
            blockMovement: true, 
            useInertia: true
        }
    }

})();

