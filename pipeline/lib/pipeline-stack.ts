import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import { Construct } from 'constructs';

interface PipelineStackProps extends cdk.StackProps {
  envName: string;
  infrastructureRepoName: string;
  infrastructureBranchName: string;
  repositoryOwner: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);
    console.log(props);
    const {
      envName,
      infrastructureRepoName,
      infrastructureBranchName,
      repositoryOwner,
    } = props;

    /** Github Token */
    const githubToken = cdk.SecretValue.secretsManager('github-token', { jsonField: 'secret' });

    const infrastructureDeployRole = new iam.Role(
      this,
      'InfrastructureDeployRole',
      {
        assumedBy: new iam.CompositePrincipal(
            new iam.ServicePrincipal('codebuild.amazonaws.com'),
            new iam.ServicePrincipal('codepipeline.amazonaws.com')
        ),
        inlinePolicies: {
          CdkDeployPermissions: new iam.PolicyDocument(
            {
              statements: [
                new iam.PolicyStatement({
                  actions: ['sts:AssumeRole'],
                  resources: ['arn:aws:iam::*:role/cdk-*']
                })
              ]
            }
          )
        }
      }
    )

    const artifactBucket = new s3.Bucket(
      this,
      'ArtifactBucket',
      {
        bucketName: `everyday465devops-${envName}-codepipeline-artifact-bucket`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    const infrastructureSourceOutput = new codepipeline.Artifact('InfrastructureSourceOutput');

    const infrastructureBuildProject = new codebuild.PipelineProject(
      this,
      'InfrastructureBuildProject',
      {
        role: infrastructureDeployRole,
        environment: {
          buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_5
        },
        environmentVariables: {
          DEPLOY_ENVIRONMENT: {
            value:envName
          }
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            install: {
              'runtime-versions':{
                nodejs:'20.x'
              },
              commands: [
                'npm install -g aws-cdk',
                'cd infrastructure',
                'npm install'
              ]
            },
            build: {
              commands: [
                `cdk deploy --context env=${envName}`
              ]
            }
          }

        }),
      }
    );

    const pipeline = new codepipeline.Pipeline(
      this,
      'CIPipeline',
      {
        pipelineName: `${envName}-CI-Pipeline`,
        role: infrastructureDeployRole,
        artifactBucket
      }
    )

    pipeline.addStage({
      stageName: 'Source',
      actions:[
        new codepipeline_actions.GitHubSourceAction({
          owner: repositoryOwner,
          repo: infrastructureRepoName,
          actionName: 'InfrastructureSource',
          branch: infrastructureBranchName,
          output: infrastructureSourceOutput,
          oauthToken: githubToken
        })
      ]
    })

    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'DeployCdkInfrastructure',
          project: infrastructureBuildProject,
          input: infrastructureSourceOutput,
          role: infrastructureDeployRole
        })
      ]
    })

  }
}
