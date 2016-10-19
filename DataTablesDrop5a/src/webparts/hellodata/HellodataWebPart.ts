/// <reference path="../../../typings/jquery/jquery.d.ts" />
/// <reference path="../../../typings/jquery.dataTables/jquery.dataTables.d.ts" />

import {
  BaseClientSideWebPart,
  IPropertyPaneSettings,
  IWebPartContext,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';

import styles from './Hellodata.module.scss';
import * as strings from 'hellodataStrings';
import ModuleLoader from '@microsoft/sp-module-loader';
import { IHellodataWebPartProps } from './IHellodataWebPartProps';
import MockHttpClient from './MockHttpClient';
import { EnvironmentType } from '@microsoft/sp-client-base';

require('jquery');
require('datatables');

export interface ISPLists {
    value: ISPList[];
}

export interface ISPList {
  Title?: string;
  Id: number;
}

export interface IListItems{
   value: IListItem[];
}

export interface IListItem {
  Title: string;
  h7vv: string;
  v7nw: string;
  mczsId: string;
  BooleanColumn: string;
}

export default class HellodataWebPart extends BaseClientSideWebPart<IHellodataWebPartProps> {

  public constructor(context: IWebPartContext) {
    super(context);
       ModuleLoader.loadCss('//cdn.datatables.net/1.10.12/css/jquery.dataTables.min.css');

  }

  ///Gets data from the mock, fake data
  private _getMockListData(): Promise<IListItems> {
    return MockHttpClient.get(this.context.pageContext.web.absoluteUrl)
      .then((data: IListItem[]) => {
          var listData: IListItems = { value: data };
          return listData;
      }) as Promise<IListItems>;
  }

  ///Checks if the environment is local, then we will load data from mock, if not from the list
  private _renderListAsync(): void {
    // Local environment
    if (this.context.environment.type === EnvironmentType.Local) {
      this._getMockListData().then((response) => {
        this._renderList(response.value);
      });
    }
    else{
      this._getListData()
        .then((response) => {
          this._renderList(response.value);
        });
    }
  }
//Title,h7vv,v7nw,mczsId,mczsStringId,BooleanColumn

  ///Render list on the datatable
  private _renderList(items: IListItem[]): void {
    $('#example').DataTable({
      data: items,
      columns: [
          { "data": "Title" },
          { "data": "h7vv" },
          { "data": "v7nw" },
          { "data": "mczs.Title" },
          { "data": "BooleanColumn" }
      ]
    });
  }

  ///Get list data
  private _getListData(): Promise<IListItems> {
    return this.context.httpClient.get(this.context.pageContext.web.absoluteUrl + `/_api/web/lists/getbytitle('Lista')/items?$select=Title,h7vv,v7nw,mczsId,mczsStringId,BooleanColumn,mczs/Name,mczs/Title&$expand=mczs/Id`)
      .then((response: Response) => {
        return response.json();
      });
  }

  /// Generar contenido HTML
  public render(): void {
    debugger;
    ModuleLoader.loadCss('//cdn.datatables.net/1.10.12/css/jquery.dataTables.min.css');
    if (this.renderedOnce === false) {
       this.domElement.innerHTML = `<table id="example" class="display" cellspacing="0" width="100%">
            <thead>
                <tr>
                    <th>Title</th>
                    <th>NumberColumn</th>
                    <th>DateColumn</th>
                    <th>PersonColumn</th>
                    <th>BooleanColumn</th>
                </tr>
            </thead>
        </table>`;
    }
   this._renderListAsync();
  }

  //Property pane fields
  protected get propertyPaneSettings(): IPropertyPaneSettings {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('listName', {
                  label: strings.ListNameFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
