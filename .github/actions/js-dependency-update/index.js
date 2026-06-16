const core = require('@actions/core');
const exec = require('@actions/exec');

const validateBranchName =({branchName}) => /^[a-zA-Z0-9_\-\.\/] +$/.test(branchName);
const validateDirectoryName = ({dirName}) => /^[a-zA-Z0-9_\-\/] +$/.test(dirName);

async function run(){
    core.info('I am a custom js function');
    const baseBranch = core.getInput('base-branch');
    const targetBranch = core.getInput('target-branch');
    const workDir = core.getInput('working-directory');
    const debug = core.getBooleanInput('debug');
    const ghToken = core.getInput('gh-token');

    core.setSecret('ghToken')

    core.info(`Base branch received: "${baseBranch}"`);

    if(!validateBranchName({branchName: baseBranch})){
        core.setFailed('invalid base-branch name')
        return;
    }

    if(!validateBranchName({branchName: targetBranch})){
        core.setFailed('invalid target-branch')
        return;   
    }

    if(!validateDirectoryName({dirName: workDir})){
        core.setFailed('invalid work dir')
        return;
    }

    core.info('[js-dependency-update]: base branch is ${baseBranch}');
    core.info('[js-dependency-update]: base branch is ${targetBranch}');
    core.info('[js-dependency-update]: base branch is ${workDir}');


    await exec.exec('npm update', [],{
        cwd: workDir
    });

    const gitStatus = await exec.getExecOutput(' git status -s package*.json', [],{
        cwd:workDir
    });

    if(gitStatus.stdout.length > 0){
        core.info('update available')
    } 
    else
    {
        core.info('no info')
    }


}

run();