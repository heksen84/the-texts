﻿/*
------------------------------
 Ilya Bobkov 2017(c) 
 https://github.com/heksen84
------------------------------*/
/*
----------------------------------
 JQUERY
----------------------------------*/	
$(document).ready(function() 
{								
	const MAX_SYMBOLS = 1000000;
	
	sweetAlertInitialize();
	BlurInput();	
	
	$("#user_login").text("Привет, "+localStorage.getItem("internal_login")+"!");
	$("#price").float(); // форматирование цены

	/* -- загрузить текст -- */
	$("#load_text").on("change", function(evt)
	{		
		var reader = new FileReader();
		f = this.files[0];
		reader.onload = (function(theFile) {
			return function(e) {            		        
				if (ByteCount(e.target.result) > MAX_SYMBOLS) 
					error("не более "+MAX_SYMBOLS+" символов");
				else
				$("#editor").val(e.target.result).trigger("keyup");
			};
		})(f);	
		reader.readAsText(f, "CP1251");	
	});

	/* -- назад или выход -- */	
	$("#writer_quit").click(function() {				
		history.back();
	});				
	
	/* -- ресайз окна -- */
	$( window ).resize(function() 
	{			
		if ($(window).width() > 576)
		{
			$("#editor").css("height", $(window).height()-150);
			$("#short_description").css("height", "100");		
		}
		else $("#editor").css("height", "440px");					
	}).trigger("resize");
		
	/* -- редактор ввод -- */
	$("#editor").keyup(function() {		
		var editor = $(this).val();		
		$("#info_panel").html("cимволов&nbsp;"+ByteCount(editor));
	});	
	
	/* -- переключатель доступа записи -- */
	$( "#record_access_mode" ).change(function() 
	{
		if ($(this).val() == 1) $("#button_add_record").text("сохранить");
		else $("#button_add_record").text("опубликовать");
		
		if ($(this).val() == 2) 		
			$("#price_label, #price, #currency").show();		
		else 		
			$("#price_label, #price, #currency").hide();		
	}).trigger("change");
			
	/*
	-----------------------
	РЕЖИМ РЕДАКТИРОВАНИЯ		
	-----------------------*/
	function CheckEditMode()
	{									
		$("#title, #short_description, #editor, #price").val("");

		localStorage.setItem("writer_record_mode", "new");		
		
		if(localStorage.getItem("read_data_id") != "")
		{						
			$.ajax
			({
				url: "..//server.php",
				data: 
				{
					"func": "SRV_ReadFullText",                    
					"record_id": localStorage.getItem("read_data_id"),
				},
				async:false,
			}).done(function( data ) 
			{									
				var obj = jQuery.parseJSON(data);				
				switch(obj.answer) 
				{
					case "error": error(obj.string); break;
					case "warning": warning(obj.string); break;
					case "success": {							
						localStorage.setItem("writer_record_id", obj.string[0].id),
						$("#title").val(obj.string[0].title);
						$("#short_description").val(obj.string[0].description);
						$("#editor").val(obj.string[0].text);
						$("#info_panel").html("Символов:&nbsp;"+$("#editor").val().length);					
						$("#type_of_literature").val(obj.string[0].type_literature);
						$("#record_access_mode").val(obj.string[0].access_mode);
						$("#button_add_record").text("обновить");
					}
				} 		
				localStorage.setItem("writer_record_mode", "edit");
				localStorage.setItem("read_data_id", "");
			});		
		}
	}
	
	
	/*
	-------------------------------
	получить категории
	-------------------------------*/
	$.ajax
	({
		url: "..//server.php",
		data: 
		{
			"func": "SRV_GetCategories",		
		},
	}).done(function( data ) 
	{			
		var obj = jQuery.parseJSON(data);
		switch(obj.answer)
		{				
			case "error": error(obj.string); break;
			case "warning": warning(obj.string); break;
			case "success": 
			{		
				$.each(obj.string, function(i, item) 
				{
					$("#type_of_literature").append("<option value='"+item.id+"'>"+item.name+"</option>");			
				});				
				CheckEditMode();
			}
		}			
	});	

    /*
	-------------------------------
	 Меню
	------------------------------- */
	$("#menu li").click(function() 
	{
		$("#menu li").css("font-weight", "");
		$(this).css("font-weight", "bold");
		switch($(this).index())
		{
			case 0: ShowBookMarks(); break;
			case 1: ShowUserData(); break;
			case 2: $(location).attr('href', "/"); break;
		}
	}).eq(0).click(); // сразу кликнуть
		
	/*
	------------------------------------------
	сохранить запись
	------------------------------------------*/
	$("#button_add_record").click(function() {	
				
		if ($("#editor").val()=="")
		{						
			$("html, body").animate({scrollTop:0}, "fast");
			$("#editor").focus();			
			warning("введите текст");
		}
		else
		if ($("#title").val()=="")
		{
			$("#title").focus();	
			warning("введите название");
		}
		else		
		if ($("#price").val()=="" && $( "#record_access_mode" ).val() == 2) 
		{
			$("#price").focus();
			warning("введите цену");
		}		
		else 
		{			
			NProgress.start();						
			$.ajax
			({
				url: "..//server.php",
				data: 
				{
					"func": "SRV_ProcessRecord",													
					"id": localStorage.getItem("writer_record_id"),
					"title": $("#title").val(),
					"short_description": $("#short_description").val(),
					"text": $("#editor").val(),
					"type_of_literature": $("#type_of_literature").val(),
					"record_access_mode": $("#record_access_mode").val(),
					"price": $("#price").val(),
					"mode": localStorage.getItem("writer_record_mode"),
				
				}, method: "POST",
			}).done(function( data ) 
			{																
				var obj = jQuery.parseJSON(data);				
				switch(obj.answer) 
				{
					case "error": error(obj.string); break;
					case "warning": warning(obj.string); break;
					case "success": {						
						$("#record_access_mode").trigger("change");
						$("input:text, textarea").val("");
						$("#info_panel").html("Символов:&nbsp;0");											
						success("готово");
					}
				}
				NProgress.done();		
			});        
		}
	});
});