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
    var OSName = "Unknown";
    if (window.navigator.userAgent.indexOf("Windows NT 10.0")!= -1) OSName="Windows 10";
    if (window.navigator.userAgent.indexOf("Windows NT 6.3") != -1) OSName="Windows 8.1";
    if (window.navigator.userAgent.indexOf("Windows NT 6.2") != -1) OSName="Windows 8";
    if (window.navigator.userAgent.indexOf("Windows NT 6.1") != -1) OSName="Windows 7";
    if (window.navigator.userAgent.indexOf("Windows NT 6.0") != -1) OSName="Windows Vista";
    if (window.navigator.userAgent.indexOf("Windows NT 5.1") != -1) OSName="Windows XP";
    if (window.navigator.userAgent.indexOf("Windows NT 5.0") != -1) OSName="Windows 2000";
    if (window.navigator.userAgent.indexOf("Mac")            != -1) OSName="Mac/iOS";
    if (window.navigator.userAgent.indexOf("X11")            != -1) OSName="UNIX";
    if (window.navigator.userAgent.indexOf("Linux")          != -1) OSName="Linux";

    //Name, PosRot
    /**
     * This stores the single transformation that was applied to this bone, what was left AFTER the parent transformations were applied.
     */
    var transformationMap = new Map()



    
    


    

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

        /**The import pose list has two prerequisites: 
        * one, you have *already imported* the .tbl model you want to animate from poses,
        * two, that the model has a group named """root""" that contains all other bones and parts.
        */
        //get and store the root part and the root model
        unDuplicateBones(null, true);



        let rootGroup = getFirstGroupByName("root");

        // console.log(rootGroup);

        let rootBones = new Map();

        addAllChildrenToMap(rootBones, rootGroup);

        // console.log(rootBones);



        var rootGroups = new Array();
        var loadedAnimationMap = new Map();
        var animationMap = new Map();
        var animations;
        var poses;

        /**
         * <Pose name, Array<TransformationHolder>>
         */
        var transformationHolderAnimMap = new Map()


        Undo.initEdit({outliner: true});


        var files;

        var filesExists = false;

        await Blockbench.import({
            type: 'json File',
            extensions: ['json'],
            readtype: 'text',
        }, (inputJsonFile) => {
            files = inputJsonFile;
            filesExists = true;
            console.log("got files!");
        });

        
        // let iterationEscapeCounter = 0
        // while(!filesExists && iterationEscapeCounter < 1000000){iterationEscapeCounter++;}
        
        console.log("Files:");
        console.log(files);

        

        animations = JSON.parse(files[0].content);
            poses = animations.poses;
            for(var key in poses){
                animationMap.set(key, poses[key]);
            }
            
            //<string, Group>
            

            var path = files[0].path
            // console.log(path);
            var pathSeperator = "\\";

            if(OSName.indexOf("Mac") != -1 || OSName.indexOf("Linux") != -1){
                pathSeperator = '/'
            }


            var splitIndex = path.lastIndexOf(pathSeperator);
            const splitPath = path.substring(0, splitIndex) + pathSeperator;
            // console.log(splitPath); 
            for(let [key, value] of animationMap){
                
                console.log(value);
                let animationPoses = []

                for(let i = 0; i < value.length; i++){
                    let file = splitPath + value[i].pose + ".tbl";
                    let importType = ImportTypeEnum.TBL;
                    var cont1 = false;

                    var tblFile;
                    
                    await Blockbench.readFile(file, {readtype: 'binary', errorbox: false}, (tblFiles) => {
                        tblFile = tblFiles
                        cont1 = true;

                    });

                    // while(!cont1){}

                    let data = tblFile[0].content;
                    // console.log(tblFile[0].content);

                    // console.log("awaiting zip loading??");
                    var await1 = new JSZip().loadAsync(data);
                    
                    await await1.then(async zip => {  
                        // console.log("Zipped! ");
                        // console.log(zip);
                        var something = zip.file(importType.file).async("string");
                        
                        await something.then(json => {
                            // console.log("group:");
                            // console.log(json);
                            // console.log(importType);
                            let poseTransformationHolderList = new Array();

                            let keyframePose = importType.import(json, key, poseTransformationHolderList);

                            // console.log(poseTransformationHolderList);

                            deduplicateTransformationHolders(poseTransformationHolderList);
                            // console.log(poseTransformationHolderList);


                            //Make them have the same names as the root pose
                            recursiveDeduplicateBones(keyframePose);

                            keyframePose.remove();

                            // rootGroups.push(keyframePose);
                            

                            // keyframePose = false;
                            // loadedPoseMap.set(value[i].pose, keyframePose);

                        
                            animationPoses[i] = {pose: keyframePose, time: value[i].time, animation: key};
                            transformationHolderAnimMap.set(value[i].pose, poseTransformationHolderList);
                            

                            // console.log(animationPoses[i]);
                        });
                    });
                    
                }

                b = 0;

                for(i = 0; i < animationPoses.length; i++){
                    let a = animationPoses[i];
                    // console.log(a);
                    b += a.time;
                }

                // for(let a in animationPoses){
                    
                //     b += a.time;
                // }
                
                console.log(key, "\nanimationLength: " + b);
                console.log(key);
                loadedAnimationMap.set(key, {poses: animationPoses, animationLength: b});
            

            }
            Undo.finishEdit('Import animations', {outliner: true})


            // console.log(transformationHolderAnimMap);



            console.log("Finished awaiting BlockBench readfile!");


        //Make the bones compliant with Java lmao



        console.log(loadedAnimationMap);


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
            length: (idleAnim.animationLength/20),
            snapping: 24
        });

        let idleTransformationHolderList = transformationHolderAnimMap.get(animationMap.get("IDLE")[0].pose);

        // var transformationIdleAnimation = new Animation({
        //     name: "IDLE_TRANSFORMHOLDER",
        //     loop: 'loop',
        //     override: 'true',
        //     length: (idleAnim.animationLength/20),
        //     snapping: 24
        // });
        let keyframeTime = 0;

        console.log(animationMap.get("IDLE"));
        console.log(idleTransformationHolderList);

        animationMap.get("IDLE").forEach((animationEntry) => { 
            buildPoseKeyframeFromLists(animationEntry, transformationHolderAnimMap, rootBones, idleAnimation, idleTransformationHolderList, keyframeTime);
            keyframeTime += animationEntry.time;

        });

        buildPoseKeyframeFromLists(animationMap.get("IDLE")[0], transformationHolderAnimMap, rootBones, idleAnimation, idleTransformationHolderList, keyframeTime);

        idleAnimation.add();

        const transitionIdleDuration = 10;
        

        let animTime = 0;

    
        loadedAnimationMap.forEach((poseTimeList, animationName) => {

            let animationEntryList = animationMap.get(animationName.toUpperCase());
            console.log((poseTimeList.animationLength - animationEntryList[animationEntryList.length - 1].time)/20 + 1/20);


            if(animationName == "IDLE"){
                return;
            }

            


            var noTransitionAnimation = new Animation({
                    name: animationName.toUpperCase() + "_NO_TRANSITIONS",
                    loop: EntityAnimationEnum[animationName.toLowerCase()].hold ? 'hold' : 'loop',
                    override: 'false',
                    length: (poseTimeList.animationLength - animationEntryList[animationEntryList.length - 1].time + 1)/20,
                    snapping: 24
                });

            var transitionBackIntoLoopAnimation = new Animation({
                name: animationName.toUpperCase() + "_TRANSITION_FOR_LOOP",
                loop: 'loop',
                override: 'false',
                length: (poseTimeList.animationLength + (poseTimeList.animationLength)/animationEntryList.length)/20,
                snapping: 24
            });

            var bothTransitionAnimation = new Animation({
                name: animationName.toUpperCase() + "_TRANSITION_IN_OUT",
                loop: 'hold',
                override: 'false',
                length: ((poseTimeList.animationLength + transitionIdleDuration * 2)/20),
                snapping: 24
            });
            var transitionInAnimation = new Animation({
                name: animationName.toUpperCase() + "_TRANSITION_IN",
                loop: 'hold',
                override: 'false',
                length: (poseTimeList.animationLength + transitionIdleDuration)/20,
                snapping: 24
            });
            var transitionOutAnimation = new Animation({
                name: animationName.toUpperCase() + "_TRANSITION_OUT",
                loop: 'hold',
                override: 'false',
                length: (poseTimeList.animationLength + transitionIdleDuration)/20,
                snapping: 24
            });


        

            let keyframeTimeArr = [0, 0, 0, 0];
            buildPoseKeyframeFromLists(animationMap.get("IDLE")[0], transformationHolderAnimMap, rootBones, bothTransitionAnimation, idleTransformationHolderList, keyframeTimeArr[1]);
            buildPoseKeyframeFromLists(animationMap.get("IDLE")[0], transformationHolderAnimMap, rootBones, transitionInAnimation, idleTransformationHolderList, keyframeTimeArr[2]);

            keyframeTimeArr[1] += transitionIdleDuration;
            keyframeTimeArr[2] += transitionIdleDuration;



            
            animationEntryList.forEach((animationEntry) => {


                buildPoseKeyframeFromLists(animationEntry, transformationHolderAnimMap, rootBones, noTransitionAnimation, idleTransformationHolderList, keyframeTimeArr[0]);
                buildPoseKeyframeFromLists(animationEntry, transformationHolderAnimMap, rootBones, transitionBackIntoLoopAnimation, idleTransformationHolderList, keyframeTimeArr[0]);
                buildPoseKeyframeFromLists(animationEntry, transformationHolderAnimMap, rootBones, bothTransitionAnimation, idleTransformationHolderList, keyframeTimeArr[1]);
                buildPoseKeyframeFromLists(animationEntry, transformationHolderAnimMap, rootBones, transitionInAnimation, idleTransformationHolderList, keyframeTimeArr[2]);
                buildPoseKeyframeFromLists(animationEntry, transformationHolderAnimMap, rootBones, transitionOutAnimation, idleTransformationHolderList, keyframeTimeArr[3]);

                keyframeTimeArr[0] += animationEntry.time;
                keyframeTimeArr[1] += animationEntry.time;
                keyframeTimeArr[2] += animationEntry.time;
                keyframeTimeArr[3] += animationEntry.time;





            });

            let lastAnimationEntry = animationMap.get(animationName)[animationMap.get(animationName).length - 1];

            buildPoseKeyframeFromLists(lastAnimationEntry, transformationHolderAnimMap, rootBones, bothTransitionAnimation, idleTransformationHolderList, keyframeTimeArr[1]);
            buildPoseKeyframeFromLists(lastAnimationEntry, transformationHolderAnimMap, rootBones, transitionOutAnimation, idleTransformationHolderList, keyframeTimeArr[3]);

            buildPoseKeyframeFromLists(animationMap.get(animationName)[0], transformationHolderAnimMap, rootBones, transitionBackIntoLoopAnimation, idleTransformationHolderList, keyframeTimeArr[0] + keyframeTimeArr[0]/animationEntryList.length);



            buildPoseKeyframeFromLists(animationMap.get("IDLE")[0], transformationHolderAnimMap, rootBones, bothTransitionAnimation, idleTransformationHolderList, keyframeTimeArr[1] + transitionIdleDuration);
            buildPoseKeyframeFromLists(animationMap.get("IDLE")[0], transformationHolderAnimMap, rootBones, transitionOutAnimation, idleTransformationHolderList, keyframeTimeArr[3] + transitionIdleDuration);


            noTransitionAnimation.add();
            transitionBackIntoLoopAnimation.add();
            bothTransitionAnimation.add();
            transitionInAnimation.add();
            transitionOutAnimation.add();


            animTime++;

        })

        rootGroups.forEach((group) => {
            group.remove();
        })



        // for(let transformationHolder in idleTransformationHolderList){
        //     let bone = rootBones.get(transformationHolder.name);

        //     let boneAnimator = transformationIdleAnimation.getBoneAnimator(bone);

            


        // }




    



        
        
        

        idleAnimation.add();

        // for(let poseContainer of idleAnim.poses){

        //     let pose = poseContainer.pose;
        //     let time = poseContainer.time;
        //     let key = poseContainer.key;

        //     recursiveCreateKeyframe(idleAnimation, pose, animTime, rootBones, false);

        //     // let rootUUID = guid();
        //     // let rootAnimatior = new BoneAnimator(rootUUID, idleAnimation, rootGroup.name);
        //     // let rootKeyframeOptions = make_Keyframe(rootGroup, time);
        //     // rootAnimatior.addKeyframe(rootKeyframeOptions.pos.keyframe, rootKeyframeOptions.pos.uuid);
        //     // rootAnimatior.addKeyframe(rootKeyframeOptions.rot.keyframe, rootKeyframeOptions.rot.uuid);
        //     // for(let group of pose.children){
        //     //     if(group instanceof Group){

        //     //     }
        //     // }
        //     animTime += time;
        // }

        // recursiveCreateKeyframe(idleAnimation, idleAnim.poses[0].pose, animTime, rootBones, false);
        

        



        let animation = 0;


        //the goal now is to make this work for all animations.
        // loadedAnimationMap.forEach((poseTimeList, animationName) => {
        //     var animation = new Animation({
        //         name: animationName.toUpperCase(),
        //         loop: EntityAnimationEnum[animationName.toLowerCase()].hold ? 'hold' : 'loop',
        //         override: 'false',
        //         length: (poseTimeList.animationLength/20),
        //         snapping: 24
        //     });

        //     let keyframeTime = 0;

        //     poseTimeList.poses.forEach((poseInfo) => {
                
        //         newRecursiveCreateKeyframe(animation, poseInfo.pose, keyframeTime, rootBones, true);

        //         keyframeTime += poseInfo.time;

        //     });

        //     animation.add();

        // });
    



        // loadedAnimationMap.forEach((poseTimeList, animationName) => {

            

        //     if(animationName.toLowerCase() == "idle" || animation > 0){
        //         return;
        //     }


        //     console.log("Building animation")
        //     console.log(animationName);
        //     console.log(poseTimeList);


        //     //no transitions animation
        //     var noTransitionAnimation = new Animation({
        //         name: animationName.toUpperCase() + "_NO_TRANSITIONS",
        //         loop: EntityAnimationEnum[animationName.toLowerCase()].hold ? 'hold' : 'loop',
        //         override: false,
        //         length: (poseTimeList.animationLength)/20,
        //         snapping: 24
        //     });


        //     // var noTransitionAnimators = new Map();
            
        //     // let noTransitionRootAnimatorUUID = guid();
        //     // var noTransitionRootnimator = new BoneAnimator(noTransitionRootAnimatorUUID, noTransitionAnimation, "root");

        //     //both transition animation
        //     var bothTransitionAnimation = new Animation({
        //         name: animationName.toUpperCase() + "_BOTH_TRANSITIONS",
        //         loop: EntityAnimationEnum[animationName.toLowerCase()].hold ? 'hold' : 'loop',
        //         override: false,
        //         length: (poseTimeList.animationLength + transitionIdleDuration * 2)/20,
        //         snapping: 24
        //     });
                
        //     // let bothTransitionRootAnimatorUUID = guid();
        //     // var bothTransitionRooteAnimator = new BoneAnimator(bothTransitionRootAnimatorUUID, bothTransitionAnimation, "root");
            
        //     //transition in animation
        //     var transitionInFromIdleAnimation = new Animation({
        //         name: animationName.toUpperCase() + "_TRANSITION_IN_FROM_IDLE",
        //         loop: EntityAnimationEnum[animationName.toLowerCase()].hold ? 'hold' : 'loop',
        //         override: false,
        //         length: (poseTimeList.animationLength + transitionIdleDuration)/20,
        //         snapping: 24
        //     });
            
        //     // let tranisitionInFromIdleRootAnimatorUUID = guid();
        //     // var tranisitionInFromIdleRootAnimator = new BoneAnimator(tranisitionInFromIdleRootAnimatorUUID, transitionInFromIdleAnimation, "root");
            

        //     //transition out animation
        //     var transitionOutToIdleAnimation = new Animation({
        //         name: animationName.toUpperCase() + "_TRANSITION_OUT_TO_IDLE",
        //         loop: EntityAnimationEnum[animationName.toLowerCase()].hold ? 'hold' : 'loop',
        //         override: false,
        //         length: (poseTimeList.animationLength + transitionIdleDuration)/20,
        //         snapping: 24
        //     });

        //     let animTime = [0, 0, 0, 0];
        //     // recursiveCreateKeyframe(bothTransitionAnimation, idleAnim.poses[0].pose, animTime[1], rootBones, true);
        //     // recursiveCreateKeyframe(transitionInFromIdleAnimation, idleAnim.poses[0].pose, animTime[2], rootBones, true);
        //     // animTime[1] = animTime[1] + transitionIdleDuration;
        //     // animTime[2] = animTime[2] + transitionIdleDuration;

            
        //     //poseInfo: instanceof {pose: keyframePose, time: value[i].time, animation: key}
        //     poseTimeList.poses.forEach((poseInfo) => {

        //         console.log("Building keyframe");
        //         console.log(poseInfo);

        //         //create the keyframes of the no transition animation
        //         recursiveCreateKeyframe(noTransitionAnimation, poseInfo.pose, animTime[0], rootBones, true);

        //         //create the keyframes of the both transition animation
        //         // recursiveCreateKeyframe(bothTransitionAnimation,  poseInfo.pose, animTime[1], rootBones, true);

        //         // //create the keyframes of the transition-in anim
        //         // recursiveCreateKeyframe(transitionInFromIdleAnimation, poseInfo.pose, animTime[2], rootBones, true);

        //         // //create the keyframes of the 
        //         // recursiveCreateKeyframe(transitionOutToIdleAnimation, poseInfo.pose, animTime[3], rootBones, true);

        //         animTime[0] = animTime[0] + poseInfo.time;
        //         animTime[1] = animTime[1] + poseInfo.time;
        //         animTime[2] = animTime[2] + poseInfo.time;
        //         animTime[3] = animTime[3] + poseInfo.time;
                
        //     });


        //     // let lastKeyframe = poseTimeList.poses[poseTimeList.poses.length - 1].pose;

        //     // recursiveCreateKeyframe(bothTransitionAnimation, lastKeyframe, animTime[1], rootBones, true);
        //     // recursiveCreateKeyframe(transitionOutToIdleAnimation, lastKeyframe, animTime[3], rootBones, true);


        //     // recursiveCreateKeyframe(bothTransitionAnimation, idleAnim.poses[0].pose, animTime[1] + transitionIdleDuration, rootBones, true);
        //     // recursiveCreateKeyframe(transitionOutToIdleAnimation, idleAnim.poses[0].pose, animTime[3] + transitionIdleDuration, rootBones, true);

        //     noTransitionAnimation.add();
        //     // bothTransitionAnimation.add();
        //     // transitionOutToIdleAnimation.add();
        //     // transitionInFromIdleAnimation.add();

        //     animation++;


        //     //for testing, REMOVE!!!!
        //     return;
            
        //     // let tranisitionOutToIdleRootAnimatorUUID = guid();
        //     // var tranisitionOutToIdleRootAnimator = new BoneAnimator(tranisitionOutToIdleRootAnimatorUUID, transitionOutToIdleAnimation, "root");


        //     //do keyframes here!
        // });




    }

    function buildPoseKeyframeFromLists(animationEntry, transformationHolderAnimMap, rootBones, animation, idleTransformationHolderList, keyframeTime) {
        // console.log(animationEntry);
        let transformationHolderList = transformationHolderAnimMap.get(animationEntry.pose);
    
        transformationHolderList.forEach((transformationHolder) => {
            let bone = rootBones.get(transformationHolder.name);
    
            let boneAnimator = animation.getBoneAnimator(bone);
    
            let idleTransformationBone = idleTransformationHolderList.find((test) => {
                // console.log(test.name, transformationHolder.name);
    
                return test.name == transformationHolder.name;
            });
    
            // console.log(idleTransformationBone);
    
            let keyframes = makeKeyframeFromTransformationHolder(transformationHolder, idleTransformationBone, keyframeTime, false);
    
    
            boneAnimator.addKeyframe(keyframes.pos[0], keyframes.pos[1]);
            boneAnimator.addKeyframe(keyframes.rot[0], keyframes.rot[1]);
    
    
        });
       
        return keyframeTime;
    }

    function addAllChildrenToMap(map, parent){
        if(!(parent instanceof Group)){
            return;
        }
        map.set(parent.name, parent);
        parent.children.forEach((child) => {
            if(child instanceof Group){
                addAllChildrenToMap(map, child);
            }
        });
    }

    function getFirstGroupByName(name){
        return Group.all.find((grp) => grp.name === name);
    }


    //return type: {contains: bool, result: contains ? Group : undefined}
    function getFirstChildByName(parent, name){
        if(parent === undefined){
            console.log(name);
            return {contains: false, result: undefined};
        }

        if(parent instanceof Group && parent.name === name ){
            return {contains: true, result: parent};
        }

        parent.children.forEach((child) => {
            if(child instanceof Group){
                let ret = getFirstChildByName(child, name);
                if(ret.contains){
                    console.log(ret);
                    return ret; 
                }else{
                    console.log(child);
                }
            }
        });
        
        console.log("Failed to find group " + name + " in parent");
        console.log(parent);
        return {contains: false, result: undefined};
    }

    function unDuplicateBones(baseGroup, all){
        if(all){
            const duplicates = []
            Group.all.forEach(x => {
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
            return;
        }
        
    }

    function deduplicateTransformationHolders(transformationHolderList){
        const duplicates = []
        transformationHolderList.forEach(x => {
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
        });
    }

    function recursiveDeduplicateBones(baseGroup){
        const duplicates = []
        baseGroup.children.forEach(x => {
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
            if(x instanceof Group){
                internalRecursiveDeduplicateBones(duplicates, x);
            }
        });
    }

    function internalRecursiveDeduplicateBones(duplicates, baseGroup){
        baseGroup.children.forEach(x => {
            if(x instanceof Group){
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
                internalRecursiveDeduplicateBones(duplicates, x);
            }
        })
    }

    function newRecursiveCreateKeyframe(animation, rootGroup, keyframeTime, modelRootMap, trackDiffs){
        let rootUUID = guid();

        if(rootGroup === undefined){//iiiidk why this would be but sure
            return;
        }

        let name = rootGroup.name;


        let rootBone = modelRootMap.get(name);

        // console.log(name + " with rotations: " + climbUpParents(rootBone));
        // console.log(name);
        // console.log(climbUpParents(rootBone));


        if(rootBone === undefined){
            console.log(rootGroup.name);
            throw new EvalError("No bone found for animation root " + animation.name);
        }        

        // let rootAnimatior = new BoneAnimator(rootUUID, animation, name);
        let rootAnimator = animation.getBoneAnimator(rootBone);
        // let transformationList = {pos: [0, 0, 0], rot: [0, 0, 0]};

        let rootKeyframeOptionsTransformationHolder = newMakeKeyframe(rootGroup, keyframeTime/20, rootBone, trackDiffs);

        let rootKeyframeOptions = rootKeyframeOptionsTransformationHolder.keyframeOptions;
        

        let posKeyframe = rootAnimator.addKeyframe(rootKeyframeOptions.pos.keyframe, rootKeyframeOptions.pos.uuid);
        let rotKeyframe = rootAnimator.addKeyframe(rootKeyframeOptions.rot.keyframe, rootKeyframeOptions.rot.uuid);

        // console.log(posKeyframe);
        // console.log(rotKeyframe);
        rootAnimator.keyframes.push(rotKeyframe);
        rootAnimator.keyframes.push(posKeyframe);

        // rootAnimatior.addToTimeline();
        
        rootGroup.children.forEach(child => {
            if(child instanceof Group){
                
                newInternalRecursiveKeyframeMaker(child, keyframeTime, animation, modelRootMap, trackDiffs); 

            }
        });
        
        transformationMap.clear();


    }


    function newInternalRecursiveKeyframeMaker(parent, keyframeTime, animation, modelRootMap, transformationList, trackDiffs){

        let name = parent.name;

        // console.log(name);
        // console.log(climbUpParents(parent));

        let bone = modelRootMap.get(name);

        if(bone === undefined){
            console.log("No " + name + " bone found for animation " + animation.name);

            // console.log(animation)
            // console.log(parent)
            // console.log(modelRootMap)

        }


        let rootAnimator = animation.getBoneAnimator(bone);

        let rootKeyframeOptionsTransformationHolder = newMakeKeyframe(parent, keyframeTime/20, bone, trackDiffs);

        let rootKeyframeOptions = rootKeyframeOptionsTransformationHolder.keyframeOptions;

        
        let posKeyframe = rootAnimator.addKeyframe(rootKeyframeOptions.pos.keyframe, rootKeyframeOptions.pos.uuid);
        let rotKeyframe = rootAnimator.addKeyframe(rootKeyframeOptions.rot.keyframe, rootKeyframeOptions.rot.uuid);
        
        
        rootAnimator.keyframes.push(rotKeyframe);
        rootAnimator.keyframes.push(posKeyframe);

        for(let child of parent.children){
            if(child instanceof Group){
                newInternalRecursiveKeyframeMaker(child, keyframeTime, animation, modelRootMap, trackDiffs);
            }
        }

    }

    function recursiveCreateKeyframe(animation, rootGroup, keyframeTime, modelRootMap, trackDiffs){
        let rootUUID = guid();

        if(rootGroup === undefined){//iiiidk why this would be but sure
            return;
        }

        let name = rootGroup.name;


        let rootBone = modelRootMap.get(name);

        // console.log(name + " with rotations: " + climbUpParents(rootBone));
        // console.log(name);
        // console.log(climbUpParents(rootBone));


        if(rootBone === undefined){
            console.log(rootGroup.name);
            throw new EvalError("No bone found for animation root " + animation.name);
        }        

        // let rootAnimatior = new BoneAnimator(rootUUID, animation, name);
        let rootAnimator = animation.getBoneAnimator(rootBone);
        let transformationList = {pos: [0, 0, 0], rot: [0, 0, 0]};

        let rootKeyframeOptionsTransformationHolder = make_Keyframe(rootGroup, keyframeTime/20, rootBone, transformationList, trackDiffs);

        let rootKeyframeOptions = rootKeyframeOptionsTransformationHolder.keyframeOptions;
        
        transformationList = rootKeyframeOptionsTransformationHolder.transformation;

        let posKeyframe = rootAnimator.addKeyframe(rootKeyframeOptions.pos.keyframe, rootKeyframeOptions.pos.uuid);
        let rotKeyframe = rootAnimator.addKeyframe(rootKeyframeOptions.rot.keyframe, rootKeyframeOptions.rot.uuid);

        // console.log(posKeyframe);
        // console.log(rotKeyframe);
        rootAnimator.keyframes.push(rotKeyframe);
        rootAnimator.keyframes.push(posKeyframe);

        // rootAnimatior.addToTimeline();
        
        rootGroup.children.forEach(child => {
            if(child instanceof Group){
                
                internalRecursiveKeyframeMaker(child, keyframeTime, animation, modelRootMap, transformationList, trackDiffs); 

            }
        });  


    }


    function internalRecursiveKeyframeMaker(parent, keyframeTime, animation, modelRootMap, transformationList, trackDiffs){

        let name = parent.name;

        // console.log(name);
        // console.log(climbUpParents(parent));

        let bone = modelRootMap.get(name);

        if(bone === undefined){
            console.log("No " + name + " bone found for animation " + animation.name);

            // console.log(animation)
            // console.log(parent)
            // console.log(modelRootMap)

        }


        let rootAnimator = animation.getBoneAnimator(bone);

        let rootKeyframeOptionsTransformationHolder = make_Keyframe(parent, keyframeTime/20, bone, transformationList, trackDiffs);

        let rootKeyframeOptions = rootKeyframeOptionsTransformationHolder.keyframeOptions;

        transformationList = rootKeyframeOptionsTransformationHolder.transformation;
        
        let posKeyframe = rootAnimator.addKeyframe(rootKeyframeOptions.pos.keyframe, rootKeyframeOptions.pos.uuid);
        let rotKeyframe = rootAnimator.addKeyframe(rootKeyframeOptions.rot.keyframe, rootKeyframeOptions.rot.uuid);
        
        
        rootAnimator.keyframes.push(rotKeyframe);
        rootAnimator.keyframes.push(posKeyframe);

        for(let child of parent.children){
            if(child instanceof Group){
                let newTransformationList = {pos: transformationList.pos, rot: transformationList.rot};
                internalRecursiveKeyframeMaker(child, keyframeTime, animation, modelRootMap, newTransformationList, trackDiffs);
            }
        }

    }

    function newMakeKeyframe(animBone, keyframeTimecode, idleBone, trackDiffs){
        //calculate the POSITION transformations that were previously applied to the PARENTS of this bone
        let parentArray = animBone.getParentArray();

        let transformationArray = new Array();
        
        for(node in parentArray){
            if(!(node instanceof Group) || (node.name === undefined) || node == "root" || transformationMap.get(node.name) === undefined){
                continue;
            }
            console.log("node: ", node);
            transformationArray.push(transformationMap.get(node.name));

            
        }

        let transformationPosRot = getPosRotFromList(transformationArray);

        let diffs = addPosProp(diffPosRot(getRotPos(animBone), getRotPos(idleBone)), transformationPosRot);

        if(trackDiffs){
            console.log("Diffs: ", diffs, "\n transformationPosRot: ", transformationPosRot);
        }



        let rotUUID = guid();
        var rotKeyframe = {
            channel: 'rotation',
            time: keyframeTimecode,
            color: -1,
            interpolation: 'catmullrom',
            data_points: [{"x": diffs.rot[0], "y": diffs.rot[1], "x": diffs.rot[2]}]
        };
        let posUUID = guid()
        var posKeyframe = ({
            channel: 'position',
            time: keyframeTimecode,
            color: -1,
            interpolation: 'catmullrom',
            data_points: [{"x": diffs.pos[0], "y": diffs.pos[1], "z":  diffs.pos[2]}]
        });

        transformationMap.set()

        return {keyframeOptions: {pos: {keyframe: posKeyframe, uuid: posUUID}, rot: {keyframe: rotKeyframe, uuid: rotUUID}}};







    }

    function makeKeyframeFromTransformationHolder(transformationHolder, idleTransformationHolder, keyframeTimecode, trackDiffs){
        let diffs = diffPosRot(transformationHolder.posRot, idleTransformationHolder.posRot);

        if(trackDiffs){
            console.log("Tracking diffs: \n","boneName: ", transformationHolder.name, "\ntransformation holder: ", transformationHolder, "\nidle holder: ", idleTransformationHolder, "\ndiffs: ", diffs);
        }
        

        let rotUUID = guid();
        var rotKeyframe = {
            channel: 'rotation',
            time: keyframeTimecode/20,
            color: -1,
            interpolation: 'catmullrom',
            data_points: [{"x": diffs.rot[0], "y": diffs.rot[1], "z": diffs.rot[2]}]
        };
        let posUUID = guid()
        var posKeyframe = ({
            channel: 'position',
            time: keyframeTimecode/20,
            color: -1,
            interpolation: 'catmullrom',
            data_points: [{"x": diffs.pos[0], "y": diffs.pos[1], "z":  diffs.pos[2]}]
        });

        return {pos: [posKeyframe, posUUID], rot: [rotKeyframe, rotUUID]};


    }

    //this assumes that the group is a single bone
    function make_Keyframe(animBone, keyframeTimecode, idleBone, transformationList, trackDiffs){


        let diffs = diffPosRot(getRotPos(animBone), getRotPos(idleBone));

        let clumbUpDiffs = diffPosRot(climbUpParents(animBone), climbUpParents(idleBone));

        

        // let addedDiffs = addPosRot(diffs, climbUpParents(idleBone));

        // let otherThingy = diffPosRot(addedDiffs, climbUpParents(animBone));


        // if(animBone.name == "hips" || animBone.name == "neck4"){

        
        //    console.log({addedDiffs: addedDiffs, otherThingy: otherThingy});
        // }
        if(trackDiffs){
            console.log("name: ", animBone.name);

            // console.log("animBone: ", getRotPos(animBone));
            // console.log();
            // console.log("modelBone: ",  getRotPos(idleBone));
            // console.log();

            console.log("Diffs: ", diffs, "\n ", "Clumb diffs: ", clumbUpDiffs);
            // console.log();
            // console.log("others, rot:", [{"x": animBone.rotation[0] - idleBone.rotation[0], "y": animBone.rotation[1] - idleBone.rotation[1], "z": animBone.rotation[2] - idleBone.rotation[2] }], " pos: ", [{"x": animBone.origin[0] - idleBone.origin[0], "y": animBone.origin[1] - idleBone.origin[1], "z":  animBone.origin[2] - idleBone.origin[2] }]);
            // console.log();
            // console.log();

            console.log("Accumulated Transformation: ", transformationList);
            console.log("Transformation Diffs: ", diffPosRot(diffs, transformationList));
        }


        let rotUUID = guid();

        // console.log(animBone.name);
        // console.log(diffs);

        

        // console.log(transformationList);

        //[{"x": animBone.rotation[0] - idleBone.rotation[0], "y": animBone.rotation[1] - idleBone.rotation[1], "z": animBone.rotation[2] - idleBone.rotation[2] }]
        //[{"x": animBone.origin[0] - idleBone.origin[0], "y": animBone.origin[1] - idleBone.origin[1], "z":  animBone.origin[2] - idleBone.origin[2] }]

        var rotKeyframe = {
            channel: 'rotation',
            time: keyframeTimecode,
            color: -1,
            interpolation: 'catmullrom',
            data_points: [{"x": diffs.rot[0] - transformationList.rot[0], "y": diffs.rot[1] - transformationList.rot[1], "x": diffs.rot[2] - transformationList.rot[2]}]
        };
        let posUUID = guid()
        var posKeyframe = ({
            channel: 'position',
            time: keyframeTimecode,
            color: -1,
            interpolation: 'catmullrom',
            data_points: [{"x": diffs.pos[0] - transformationList.pos[0], "y": diffs.pos[1] - transformationList.pos[1], "z":  diffs.pos[2] - transformationList.pos[2]}]
        });

        let x = transformationList.pos[0];
        let y = transformationList.pos[1];
        let z = transformationList.pos[2];

        // if(!isPosPropEqual(diffs, transformationList)){
            if(!equalWithinTolerance(diffs.pos[0], x)){
                x += diffs.pos[0];
            }
            if(!equalWithinTolerance(diffs.pos[1], y)){
                y += diffs.pos[1];
            }
            if(!equalWithinTolerance(diffs.pos[2], z)){
                z += diffs.pos[2];
            }
            // transformationList = addPosProp(transformationList, diffs);
        // }

        transformationList = {pos: [Math.roundTo(x, 7), Math.roundTo(y, 7), Math.roundTo(z, 7)], rot: [0,0,0]};



        


        

        return {keyframeOptions: {pos: {keyframe: posKeyframe, uuid: posUUID}, rot: {keyframe: rotKeyframe, uuid: rotUUID}}, transformation: transformationList};



    }

    const ZeroPosRot = {pos: [0, 0, 0], rot: [0, 0, 0]};

    function getPosRotFromList(list){
        let a = {pos: [0, 0, 0], rot: [0, 0, 0]};

        if(!(list.length == 0)){
            console.log("list: ", list)
            for(let posRot in list){
                if(posRot === undefined){
                    continue;
                }
                console.log(posRot);
                a = addPosRot(a, posRot);
            }
        }
        return a;
    }

    function getRotPos(group){
        return {pos: [group.origin[0], group.origin[1], group.origin[2]], rot: [group.rotation[0], group.rotation[1], group.rotation[2]]};
    }

    function climbUpParents(group){


        if(group.parent === 'root'){
            return {pos: group.origin, rot: group.rotation};
        }
        
        

        let posRotProp = climbUpParents(group.parent);
        return {pos: 
                    [posRotProp.pos[0] + group.origin[0], posRotProp.pos[1] + group.origin[1], posRotProp.pos[2] + group.origin[2]],
                rot: 
                    [posRotProp.rot[0] + group.rotation[0], posRotProp.rot[1] + group.rotation[1], posRotProp.rot[2] + group.rotation[2]]
                };
    }


    function countStepsUpTo(i, start, name){
        if(start.name == name || start.name == "root"){
            return i;
        }
        return countStepsUpTo(i + 1, start.parent, name);
    }

    function diffPosRot(g1, g2){
        return {pos: 
                    [g1.pos[0] - g2.pos[0], g1.pos[1] - g2.pos[1], g1.pos[2] - g2.pos[2]], 
                rot: 
                    [g1.rot[0] - g2.rot[0], g1.rot[1] - g2.rot[1], g1.rot[2] - g2.rot[2]]};
    }

    function subPosRot(g1, g2){
        return {pos: 
                    [g1.pos[0] - g2.pos[0], g1.pos[1] - g2.pos[1], g1.pos[2] - g2.pos[2]], 
                rot: 
                    [g1.rot[0] - g2.rot[0], g1.rot[1] - g2.rot[1], g1.rot[2] - g2.rot[2]]};
    }


    function addPosRot(g1, g2){
        return {pos: 
                    [g1.pos[0] + g2.pos[0], g1.pos[1] + g2.pos[1], g1.pos[2] + g2.pos[2]], 
                rot: 
                    [g1.rot[0] + g2.rot[0], g1.rot[1] + g2.rot[1], g1.rot[2] + g2.rot[2]]};
    }

    function addPosProp(g1, g2){
        return {pos: 
            [g1.pos[0] + g2.pos[0], g1.pos[1] + g2.pos[1], g1.pos[2] + g2.pos[2]], 
            rot: g1.rot};

    }

    function arePosRotEqual(g1, g2){
        return g1.pos[0] === g2.pos[0] 
                && g1.pos[1] === g2.pos[1] 
                && g1.pos[2] === g2.pos[2] 
                && g1.rot[0] === g2.rot[0] 
                && g1.rot[1] === g2.rot[1] 
                && g1.rot[2] === g2.rot[2];
    }

    function isPosPropEqual(g1, g2){
        return equalWithinTolerance(g1.pos[0], g2.pos[0])
                && equalWithinTolerance(g1.pos[1], g2.pos[1])
                && equalWithinTolerance(g1.pos[2], g2.pos[2]);
    }

    function boundPosRot(g1){
        
    }

    function equalWithinTolerance(a, b){
        return Math.abs((a - b)) < (1e-5); 
    }
    
    function isPosRotEmpty(g1){
        return arePosRotEqual(g1, ZeroPosRot);
    }

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
        }
    }

    // function loadTechneModel(data) {

    //     reader = new DOMParser();
    //     var xml = reader.parseFromString(data, "text/xml");
    
    //     var model = xml.getElementsByTagName("Model")[0];
        
    //     name = xml.getElementsByTagName("ProjectName")[0].childNodes[0].nodeValue;
    //     textureSizes = xml.getElementsByTagName("TextureSize")[0].childNodes[0].nodeValue;
    
    //     Project.name = name;
    //     Project.texture_width = textureSizes.slice(0, textureSizes.indexOf(","));
    //     Project.texture_height = textureSizes.slice(textureSizes.indexOf(",") + 1, textureSizes.length);
        
    //     var shapes = model.getElementsByTagName("Geometry")[0].getElementsByTagName("Shape");
    //     var rootGroup = new Group("root").addTo();
    //     rootGroup.init();
    
    //     for(var i = 0; i < shapes.length; i++){
    //         var shape = shapes[i];
            
    //         offset = JSON.parse("[" + shape.getElementsByTagName("Offset")[0].childNodes[0].nodeValue + "]");
    //         position = JSON.parse("[" + shape.getElementsByTagName("Position")[0].childNodes[0].nodeValue + "]");
    //         position[1] = 24 - position[1];
    //         rotation = JSON.parse("[" + shape.getElementsByTagName("Rotation")[0].childNodes[0].nodeValue + "]");
    //         size = JSON.parse("[" + shape.getElementsByTagName("Size")[0].childNodes[0].nodeValue + "]");
    //         uv = JSON.parse("[" + shape.getElementsByTagName("TextureOffset")[0].childNodes[0].nodeValue + "]");
    //         mirror = shape.getElementsByTagName("TextureOffset")[0].childNodes[0].nodeValue === "True";
            
    //         var group = new Group(
    //             {
    //                 name: shape.getAttribute("name"),
    //                 origin: [position[0], position[1], position[2]],
    //                 rotation: [-rotation[0], rotation[1], rotation[2]],
    //             }
    //         ).addTo(rootGroup);
    //         group.init();
            
    //         var cube = new Cube(
    //             {
    //                 mirror_uv: mirror,
    //                 name: shape.getAttribute("name"),
    //                 from: [position[0] + offset[0], position[1] - size[1] - offset[1], position[2] + offset[2]],
    //                 to: [position[0] + size[0] + offset[0], position[1] - offset[1], position[2] + offset[2] + size[2]],
    //                 uv_offset: [uv[0],  uv[1]],
    //             }
    //         ).addTo(group);
    //         cube.init();
    //     }
    //     Canvas.updateAll()
    // }
    
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
    
    function loadTabulaModel(data, animationName, poseTransformationHolderList) {
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
                        visibility: false,
                    }
                ).addTo();
                // .addTo();
                rootGroup.init();
                json.cubes.forEach(cube => readTblBone(cube, version, rootGroup, animationName, poseTransformationHolderList));



                return rootGroup;
        }
        
    
        Undo.finishEdit('Import Tabula Model', {
			outliner: true,
			bitmap: true,
			uv_mode: true,
		});
        Canvas.updateAll();
    }

    class TransformationHolder{
        posRot = {pos: [0, 0, 0], rot: [0, 0, 0]};
        name = "";
        /**This is another Transformation Holder or "root" */
        //I lied this is the name of the parent transformation holder
        parent = 'root';


    }
    
    function readTblBone(json, version, parentGroup, animationName, poseTransformationHolderList){
        var group;
        switch(version){
            case 5:
                group = new Group({
                    name: json.name,
                    origin: [(parentGroup == null ? 0 : parentGroup.origin[0]) + json.rotPX, (parentGroup == null ?  + 24 : parentGroup.origin[1]) - json.rotPY, (parentGroup == null ? 0 : parentGroup.origin[2]) + json.rotPZ],
                    rotation: [-json.rotAX, json.rotAY, -json.rotAZ],
                    // visibility: false
                });
                break;
            case 2:
                group = new Group({
                    name: json.name,
                    origin: [parentGroup.origin[0] + json.position[0], parentGroup.origin[1] - json.position[1], parentGroup.origin[2] + json.position[2]],
                    rotation: [-json.rotation[0], json.rotation[1], -json.rotation[2]],
                    // visibility: false
                });
                break;
            default:
        
                group = new Group({
                    name: json.name,
                    origin: [parentGroup.origin[0] + json.position[0], parentGroup.origin[1] - json.position[1], parentGroup.origin[2] + json.position[2]],
                    rotation: [-json.rotation[0], json.rotation[1], json.rotation[2]],
                    // visibility: false
                });

                let transformHolder = new TransformationHolder();
                transformHolder.posRot = {pos: [json.position[0], -json.position[1], json.position[2]], 
                                            rot: [json.rotation[0], -json.rotation[1], json.rotation[2]]};

                let name = json.name.valueOf();
                while(name.indexOf(" ") != -1){
                    name = name.replace(" ", "");
                }

                transformHolder.name = name;//lmao
            
                
                // if(group.name.indexOf("u") != -1){
                //     console.log(name, group.name);
                // }
                
                if(parentGroup){
                    transformHolder.parent = parentGroup.name;
                }

                poseTransformationHolderList.push(transformHolder);
                break;
        }
        if(group === undefined){
            return;
        }


        if(parentGroup) group.addTo(parentGroup);
        group.init();
    
        switch(version){
            case 5:
                if(json.children) json.children.forEach(bone => readTblBone(bone, version, group, animationName, poseTransformationHolderList));
                if(json.boxes) json.boxes.forEach(cube => readTblCube(cube, version, group, json));
                break;
            default:
                if(json.children) json.children.forEach(bone => readTblBone(bone, version, group, animationName, poseTransformationHolderList));
                readTblCube(json, version, group, animationName, poseTransformationHolderList);
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



