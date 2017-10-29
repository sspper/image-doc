
def branchAndBuildTag() {
    return "${env.BRANCH_NAME}${env.BUILD_NUMBER}"
}
def branchTag() {
    return "${env.BRANCH_NAME}"
}


def doBuild() {

// #Develop Build tag and Push
if('master' == branchTag()) {
    stage('master-build') {
        def image = docker.build("ssp25/sspcloud")
	image.push(branchTag())
        image.push(branchAndBuildTag())    
      }
  }
// # Release Build Tag and Push
if('release' == branchTag()) {
    stage('release-build') {
        def image = docker.build("ssp25/sspcloud")
        image.push(branchTag())
        image.push(branchAndBuildTag())        
    }
  } 
}


node ('docker') {

  stage(name: 'SCM') {
    checkout scm
}


//    stage(name: 'delivery') {
  //      checkout([$class: 'GitSCM', branches: [[name: "*/*"]], doGenerateSubmoduleConfigurations: false, extensions: [[$class: 'RelativeTargetDirectory', relativeTargetDir: 'delivery']], submoduleCfg: [], userRemoteConfigs: [[url: 'https://github.com/sspper/image-doc.git']]])
    //    sh 'ls .'
//	delivery = load 'branchtag.groovy'
//} */
    
    try {
    withCredentials([usernamePassword(credentialsId: '8bca1236-1fcb-40ea-b19c-07e7eb8910d1', passwordVariable: 'dockerhubPass', usernameVariable: 'dockerhubUser')]) {
        sh "docker login -u ${dockerhubUser} -p ${dockerhubPass}"
     }
        doBuild() // You implement doBuild
	

        
    } catch (e) {
        currentBuild.result = "FAILED"
        echo "${e.getClass().getName()} - ${e.getMessage()}"
        throw e
    }
}
