'use client';

import { useState } from 'react';
import { Octokit } from '@octokit/rest';
import { GetResponseTypeFromEndpointMethod } from '@octokit/types';
import { GitHubReposContext } from '@/types/GitHubReposContext';
import FileContext from './FileContext';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/github/tokenManager';
import FolderContext from './FolderContext';
import PathLayers from './PathLayers';

export default function RepoContentFetcher() {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const octokit = new Octokit({
    auth: accessToken,
  });

  type GitHubTreeContent = GetResponseTypeFromEndpointMethod<typeof octokit.repos.getContent>

  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [path, setPath] = useState('');
  const [contents, setContents] = useState<GitHubTreeContent>();
  const [error, setError] = useState<string | null>(null);

  const getRepoContents = async (_owner = owner, _repo = repo, _path = path) => {
    try {
      const response = await octokit.repos.getContent({
        owner: _owner,
        repo: _repo,
        path: _path,
      });
      console.log(response.data)
      setContents(response);
      setError(null);
    } catch (err) {
      console.error('エラーが発生しました:', err);
      setError('リポジトリの内容を取得できませんでした。');
      setContents(undefined);
    }
  };

  const changePath = (updatedPath: string) => {
    setPath(updatedPath)
    getRepoContents(owner, repo, updatedPath)
  }

  return (
    <div>
      <h2>リポジトリの内容を取得</h2>
      <div>
        <input
          type='text'
          placeholder='オーナー'
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          className='border p-2 mb-2'
        />
        <input
          type='text'
          placeholder='リポジトリ名'
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          className='border p-2 mb-2'
        />
        <input
          type='text'
          placeholder='パス (任意)'
          value={path}
          onChange={(e) => setPath(e.target.value)}
          className='border p-2 mb-2'
        />
        <button onClick={() => getRepoContents()} className='bg-blue-500 text-white p-2'>
          取得
        </button>
      </div>

      {error && <div className='text-red-500'>{error}</div>}

      <PathLayers path={path} setPathFunc={changePath} />

      {contents && (
        <ul className='max-w-full w-[40rem]'>
          {Array.isArray(contents.data) &&
            contents.data.map((item: GitHubReposContext) => (
              <li key={item.path}>
                {item.type === 'file' ?
                  <FileContext item={item} /> :
                  <FolderContext setPathFunc={changePath} item={item} />}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
