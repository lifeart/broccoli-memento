const UBER_CACHE = {
  buildType: 'initial',
  substrExistsInArray(str, arr) {
    let size = arr.length;
    for (let i = 0; i < size; i++) {
      if (str.includes(arr[i])) {
        return true;
      }
    }
    return false;
  },
  leafCache: new Map(),
  stylesTrees: [
    'styles',
    'Concat: Vendor Styles/assets/vendor.css',
    'Funnel (styles)'
  ],
  compiledHBSandJSTrees: [
    'TreeMerger (preprocessedApp & templates)',
    'Babel: frontend',
    // 'Funnel (ember-cli-tree)',
    'TreeMerger (appAndDependencies)',
    'Concat App',
    'Assembler (vendor & appJS)'
  ],
  templatesTrees: [
    'TreeMerger (templates)',
    'ProcessedTemplateTree',
    'Funnel: Pod Templates'
  ],
  jsTrees: [
    'Funnel (config)',
    'Funnel: Filtered App',
    'TreeMerger (app)',
    'ProcessedAppTree'
  ],
  annotationTreesPaths: [
    'Addon#treeFor (ember-',
    'Addon#treeFor (liquid-',
    'Addon#treeForPublic',
    'Addon#treeForStyles',
    '#treeForVendor',
    'Addon#_addonTemplateFiles',
    'Addon#compileAddon',
    'addonPreprocessTree(template)',
    'Babel: ember-',
    'Babel: @ember-',
    'Funnel: addon-tree-output',
    'Babel: moment',
    "TreeMerger: `addon/` trees",
    "TreeMerger: (vendor)",
    "Funnel (vendor)",
    'Vendor JS',
    'Babel: liquid-',
    'Creator math/',
    'Creator ember-'
  ],
  excludedAnnotationTreesPaths: ['Babel: ember-data'],
  directoryTrees: ['ember-','node_modules','ember/','moment'],
  hasCachableAnnotation(subtree) {
    let annotation = subtree._annotation;
    let destDir = subtree.destDir;
    let name = subtree.name;
    let key = annotation;

    let has =  annotation && 
    (this.substrExistsInArray(annotation, this.annotationTreesPaths)
      || this.stylesTrees.includes(annotation)
      || this.templatesTrees.includes(annotation)
      || this.jsTrees.includes(annotation)
      || this.compiledHBSandJSTrees.includes(annotation)
    ) && (
      !this.substrExistsInArray(annotation, this.excludedAnnotationTreesPaths)
    )
  
    if (!has && annotation && annotation.includes('TreeMerger (custom transform:')) {
      has = true;
      key = annotation + subtree.outputPath;
    }
  
    if (!has && annotation && annotation.includes('TreeMerger (ExternalTree)')) {
      has = true;
      key = annotation + subtree.outputPath;
    }
  
    if (!has && name === 'UnwatchedDir') {
      has = true;
      key = name + subtree._directoryPath;
    }
  
    if (!has && name && destDir) {
      has = this.substrExistsInArray(destDir, this.directoryTrees);
  
      if (has) {
        key = name + destDir;
      }
    }
  
    if (!has && name && name === 'broccoli-persistent-filter:ReplaceFilter' && subtree.files && subtree.files.length) {
      has = true;
      key = name + subtree.files.join(':');
    }
  
    return [has, key];
  },
  cleanJSCache() {
    this.jsTrees.map(key=>{
      this.leafCache.delete(key);
    });
  },
  cleanStylesCache() {
    this.stylesTrees.map(key=>{
      this.leafCache.delete(key);
    });
  },
  cleanTemplatesCache() {
    this.templatesTrees.map(key=>{
      this.leafCache.delete(key);
    })
  },
  cleanExtraCache() {
    this.compiledHBSandJSTrees.map(key=>{
      this.leafCache.delete(key);
    });
  },
  cleanUp(changedFiles = []) {
    if (!changedFiles.length) {
      return;
    }
    let hasChangedStyles = changedFiles.filter(file=>{
      return file.includes('.scss') || file.includes('.css');
    }).length;
    let hasChangedTemplates = changedFiles.filter(file=>{
      return file.includes('.hbs');
    }).length;
    let hasChangedScripts = changedFiles.filter(file=>{
      return file.includes('.js');
    }).length;
  
    if (hasChangedScripts) {
      this.cleanJSCache();
    }
    if (hasChangedStyles) {
      this.cleanStylesCache();
    }
    if (hasChangedTemplates) {
      this.cleanTemplatesCache();
    }
    if (hasChangedScripts || hasChangedTemplates) {
      this.cleanExtraCache();
    }
  },
  getItemFromCache(subtree) {
    if (this.isFirstBuild()) {
      return false;
    }
    let [has, key] = this.hasCachableAnnotation(subtree);
    if (has && this.leafCache.has(key)) {
      return this.leafCache.get(key);
    } else {
      // console.log(subtree);
      // console.log('-------------');
    }
    return false;
  },
  addItemToCache(subtree, childNode) {
    if (this.isFirstBuild()) {
      return false;
    }
    let [hasItem, itemKey] = this.hasCachableAnnotation(subtree);
    if (hasItem) {
      this.leafCache.set(itemKey, childNode);
    } else {
      if (subtree._annotation) {
        console.log(subtree._annotation);
      }
    }
  },
  isFirstBuild() {
    return this.buildType === 'initial';
  },
  setStrategy({changedFiles, type}) {
    this.buildType = type;
    if (!this.isFirstBuild()) {
      this.cleanUp(changedFiles);
    }
  }
}

module.exports.Cache = UBER_CACHE;
